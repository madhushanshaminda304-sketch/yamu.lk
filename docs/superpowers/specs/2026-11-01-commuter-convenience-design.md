# Design Spec: Sri Lankan Commuter Convenience & Safety Suite

**Date**: 2026-11-01  
**Project**: Yamu (`yamu.lk` / `blablacar-lk`)  
**Status**: Ready for Approval  

---

## 1. Intent & The Why

Yamu is designed to serve daily and weekend intercity commuters in Sri Lanka across key corridors (E01 Southern Expressway, A1/E04 Central Expressway, E03 Airport Highway, etc.). While corporate platforms like BlaBlaCar India layer on heavy monetization features (mandatory booking fees, payment gateway 3D-Secure challenges, and complex document scans), these often introduce severe friction and cart abandonment for commuters in South Asia.

Instead, commuters need frictionless real-world utility:
1. **Instant, reliable coordination**: Finding drivers at busy multi-modal centers (e.g., Makumbura MMC or Kadawatha Flyover) requires instant communication via tools commuters already use (WhatsApp and Google Maps).
2. **Peace of mind for families & solo female travelers**: A 1-tap "Share My Trip" dispatch so loved ones know vehicle details, driver identity, route, and estimated arrival.
3. **Round-trip driver convenience**: Over 70% of intercity weekend drivers commute out on Friday and return on Sunday; publishing both legs should take one click with guaranteed route and stop reversal.
4. **Trunk space & luggage clarity**: Pre-trip clarity on luggage capacity prevents curb rejections (crucial for airport trips on E03 Katunayake or surf trips to Weligama).
5. **Offline resilience**: Expressway dead-zones cause anxiety when riders can't access booking details; an offline-cached digital "Ride Pass" ensures vital details are always on-screen.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- **1-Click WhatsApp Coordination**: Directly initiate a WhatsApp chat with the driver using pre-filled ride details (passenger name, seats booked, pickup landmark, departure time). Normalizes numbers to purely numeric E.164 digits (`947XXXXXXXX`).
- **Exact Landmark Navigation**: 1-click Google Maps pin linking directly to the specific highway interchange or multimodal bay (e.g., Makumbura E01 Bay, Kadawatha Interchange, Pinnaduwa Exit).
- **1-Tap "Share My Trip"**: Utilize native Web Share API (`navigator.share`) with graceful WhatsApp fallback and clipboard fallback (ignoring user intentional `AbortError`).
- **Offline-Ready Digital Ride Pass**: A modal/card summarizing the confirmed booking (driver contact, vehicle model, departure, pickup point, deterministic 4-digit boarding PIN, payment reminder) accessible even if signal drops.
- **1-Click Return Trip Publishing**: Allow drivers to toggle "Publish Return Trip" during ride creation, auto-reversing hubs, intermediate stops, and pricing for a selected return date/time, enforcing a minimum 30-minute turnaround after outbound arrival.
- **Luggage Capacity Indicator**: Three distinct luggage tiers (`small` backpack, `medium` suitcase, `large` airport luggage) visible on ride cards, search filters, and the publisher wizard.

### Non-Goals
- Payment gateway integration (Cards/IPG) in this milestone: transactions remain direct P2P (LankaQR or cash onboard).
- Custom in-app websocket chat server: WhatsApp covers 99%+ of commuter communication with superior reliability.
- Live GPS telemetry / fleet tracking backend: replaced by verified landmarks and Google Maps pin coordinates.

### Anti-Goals
- No modal lockups or broken links when WhatsApp is not installed: fallback to standard telephone dialer (`tel:`) and clipboard copy.
- No silent failures: all share and copy actions provide haptic feedback and Emil Kowalski's `sonner` confirmation toasts.
- Maintain ECC file limit rule: no source file exceeding 800 lines. Specifically, extract auth persistence helpers from `src/state/store.ts` into `src/state/persistence.ts` to keep `store.ts` well below 750 lines.

---

## 3. Approaches Considered & Selected

1. **Approach 1: Lean Client-Native Integration**
   - *Description*: WhatsApp deep links (`wa.me`), Google Maps URL schemes, and Web Share API.
   - *Assessment*: Fast and lightweight, but lacks offline fallback when entering highway connectivity blackouts.
2. **Approach 2: Heavy In-App Chat & Notification Server**
   - *Description*: Custom web chat drawers and socket servers.
   - *Assessment*: Rejected. High maintenance, drains mobile battery, and commuters miss alerts when browser tabs sleep.
3. **Approach 3: Client-Native Suite + Offline Digital Ride Pass (SELECTED)**
   - *Description*: Combines 1-click WhatsApp & Maps links, 1-tap family trip sharing, 1-click return trip creation, luggage capacity indicators, AND a locally cached offline "Ride Pass" modal.
   - *Rationale*: Best match for real Sri Lankan travel conditions. Delivers high trust and zero server costs.

---

## 4. Architectural & Component Design

### A. Domain & Utility Layer (`src/domain/sharing.ts`)
Create a focused sharing and navigation utility module:
- `buildWhatsAppCoordinationUrl(driverPhone: string, ride: Ride, booking: BookingRecord, landmark: string): string`
  - Normalizes phone number to purely numeric E.164 (`driverPhone.replace(/\D/g, '')`).
  - Pre-fills message:
    *"Hi [Driver], I booked a seat on Yamu for your trip from [Origin] to [Destination] departing at [Time]. My pickup point is [Landmark]. See you there!"*
- `buildGoogleMapsLandmarkUrl(landmarkName: string, hubLat?: number, hubLng?: number): string`
  - Targets `https://www.google.com/maps/search/?api=1&query=...` with GPS coordinates or localized landmark name.
- `buildSafetyShareText(ride: Ride, booking: BookingRecord, driver: UserProfile): string`
  - Generates:
    *"🛡️ Yamu Trip Share: I am traveling from [Origin] to [Destination] with driver [Name] ([Rating]★, [Car]). Scheduled departure: [Date Time]. Arriving ~[ETA]. Contact: [Phone]. Boarding PIN: #[PIN]"*
- `shareTripDetails(text: string): Promise<{ success: boolean; method: 'native' | 'clipboard' | 'cancelled' }>`
  - Uses `navigator.share`; if aborted (`error.name === 'AbortError'`), returns `'cancelled'` without showing an error or fallback. If unsupported, copies to clipboard and fires a `sonner` success toast.
- `deriveBoardingPin(bookingId: string): string`
  - Deterministically extracts a 4-digit code (e.g. `bookingId.replace(/\D/g, '').slice(-4) || '8419'`).

### B. State & Types Extensions (`src/state/types.ts`, `src/state/store.ts`, `src/state/persistence.ts`)
- **Luggage Capacity**:
  ```typescript
  import type { LuggageSize } from '../domain/matching.ts';
  export type LuggageCapacity = LuggageSize; // 'small' | 'medium' | 'large'
  export type Booking = BookingRecord;
  ```
  Add `luggageCapacity?: LuggageCapacity` to `Ride` interface (defaults to `'medium'`).
- **Store Refactoring for 800-Line Rule**:
  - Extract `loadPersistedAuth` and `persistAuth` to `src/state/persistence.ts`.
  - Add `returnTripEnabled?: boolean`, `returnDate?: string`, `returnTime?: string` to `PublishRideInput`.
  - Validate minimum 30-minute buffer: `returnDeparture >= outboundArrival + 30m`.
  - In `publishRide()`, if `returnTripEnabled`, atomically create the reverse ride:
    - Origin $\leftrightarrow$ Destination reversed.
    - `pickupLandmark = dropoffLandmark || destHub.landmarks[0]`.
    - `dropoffLandmark = pickupLandmark || originHub.landmarks[0]`.
    - Same `corridorId`, `tollPolicy`, and `clampedPriceLkr`.
    - Stops sorted according to reverse corridor slice.

### C. UI Components
1. **`src/components/RidePassModal.tsx`**:
   - Boarding pass dialog showing:
     - Prominent Trip Summary (Origin $\rightarrow$ Destination, Departure Time, Seat Count, Total LKR).
     - Driver profile with verified phone badge and Super Driver star rating.
     - 4-digit Boarding PIN.
     - 1-Click Action Bar:
       - 🟢 **WhatsApp Driver** (`wa.me`)
       - 📍 **Pickup Directions** (Google Maps)
       - 🛡️ **Share with Family** (`shareTripDetails()`)
     - Offline badge: *"✓ Saved on device — accessible without internet"*.
2. **`src/components/RideCardItem.tsx`**:
   - Display a compact luggage icon badge (`🎒 Small bag`, `🧳 Medium luggage`, `✈️ Airport luggage`).
3. **`src/views/PublishRideView.tsx`**:
   - Step 3 (Preferences): 3-button luggage selector with icons.
   - Step 6 (Review & Publish): "🔄 Publish Return Trip" toggle with return date/time picker. Auto-syncs return date when outbound date changes.
4. **`src/views/RideDetailView.tsx` & `src/views/YourRidesView.tsx`**:
   - After booking confirmation, display **"View Digital Ride Pass"** button prominently with direct WhatsApp and Google Maps links.

---

## 5. Verification & Testing Plan
- **Unit Tests (`tests/sharing.test.ts`)**:
  - Test E.164 phone normalization in WhatsApp URLs.
  - Test Google Maps URL generation with coordinate and landmark query fallbacks.
  - Test safety share string composition and boarding PIN derivation.
- **Store Integration Tests (`tests/returnRide.test.ts`)**:
  - Test publishing an outbound ride with `returnTripEnabled: true`.
  - Assert two rides are created with reversed hubs and intermediate stops.
  - Assert 30-minute minimum buffer validation.
  - Assert luggage capacity is stored and retrieved correctly.
- **Build & Quality Gates**:
  - `npm test` passing with 100% green suites.
  - `npm run build` with 0 type errors.
  - Strict compliance with ECC rule (<800 lines per file).
