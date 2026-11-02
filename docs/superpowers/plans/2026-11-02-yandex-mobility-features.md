# Yandex-Inspired Advanced Mobility Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate top-tier mobility features reverse-engineered from Yandex Go (`taxi.yandex.com`) into Yamo: "Book for Someone Else", Vehicle Comfort Tiers, Quiet Commute Mode, Driver "Start Journey" Live En Route Status, and Visual Expressway Route Maps.

**Architecture:** Extend domain types in `src/domain/matching.ts` and `src/state/types.ts`. Add journey lifecycle state (`scheduled` | `departed` | `completed`) and guest passenger booking to `src/state/store.ts`. Enhance UI in `RideDetailView.tsx`, `SearchView.tsx`, `PublishRideView.tsx`, `YourRidesView.tsx`, and `RidePassModal.tsx` while staying strictly under the 800-line ceiling per file.

**Tech Stack:** React 19, TypeScript, Phosphor Icons, Sonner Toasts, Node Test Runner.

**Spec:** Yandex Go reverse-engineering adaptation for Sri Lankan intercity carpooling.

## Global Constraints
- Brand name: strictly **Yamo** (`yamo.lk`).
- Theme: Ceylon Emerald (`#047857`), Deep Pine (`#064E3B`), and Sunburst Gold (`#F59E0B`).
- All 38 existing tests must remain green; add new unit tests for all new domain behaviors.
- Every file must remain strictly under 800 lines (ECC rule).
- Zero build warnings in Vite 6 production build.

## Review Focus
- Booking for someone else correctly persists guest passenger name and mobile number.
- WhatsApp coordination links and boarding PINs use the guest passenger's phone and name.
- Vehicle category filter (Car / SUV / Van) and Quiet Ride filter correctly narrow search results.
- Driver "Start Journey" updates `journeyStatus` to `departed` and renders real-time "🟢 Driver En Route" badges on boarding passes.
- Visual Expressway Route map renders cleanly across mobile and desktop viewports.

---

### Task 1: Domain Types & Search Filtering Extensions
**Files:**
- Modify: `src/domain/matching.ts`
- Modify: `src/state/types.ts`
- Test: `tests/matching_features.test.ts`

**Interfaces:**
- Consumes: `Ride`, `BookingRecord`, `ComfortProfile`, `SearchQuery`.
- Produces: `journeyStatus: 'scheduled' | 'departed' | 'completed'`, `isBookingForOther?: boolean`, `quietRide?: boolean`, `vehicleCategory?: VehicleCategory | 'all'`, `quietRideOnly?: boolean`.

- [ ] **Step 1: Write failing unit test in `tests/matching_features.test.ts` testing guest booking, vehicle category filtering, and quiet ride filters**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Update `src/domain/matching.ts` and `src/state/types.ts` with new fields and filter logic**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit changes**

---

### Task 2: Store Actions for Guest Booking & Driver Journey Status
**Files:**
- Modify: `src/state/store.ts`
- Test: `tests/store_journey.test.ts`

**Interfaces:**
- Consumes: `MarketplaceStore`, `BookingRecord`, `Ride`.
- Produces: `updateRideJourneyStatus(rideId, status)`, extended `bookRideLeg` with guest passenger arguments.

- [ ] **Step 1: Write failing unit test in `tests/store_journey.test.ts` for `updateRideJourneyStatus` and guest booking delegation**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement `updateRideJourneyStatus` in `src/state/store.ts` with passenger notification dispatch**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit changes**

---

### Task 3: "Book for Someone Else" & Visual Corridor Route Map in `RideDetailView.tsx`
**Files:**
- Modify: `src/views/RideDetailView.tsx`

**Interfaces:**
- Consumes: `Ride`, `LegBookingCheck`, `bookRideLeg`.
- Produces: Guest booking toggle inputs (`passengerName`, `passengerPhone`), SVG expressway corridor visualization.

- [ ] **Step 1: Add Guest Booking UI toggle ("Booking for family/friend?") in `RideDetailView.tsx`**
- [ ] **Step 2: Add SVG Visual Expressway Corridor route line with interactive stopover landmarks**
- [ ] **Step 3: Verify build passes without syntax/type errors**
- [ ] **Step 4: Commit changes**

---

### Task 4: Vehicle Comfort Tiers & Quiet Commute in `SearchView.tsx` & `PublishRideView.tsx`
**Files:**
- Modify: `src/views/SearchView.tsx`
- Modify: `src/views/PublishRideView.tsx`
- Modify: `src/components/RideCardItem.tsx`

**Interfaces:**
- Consumes: `VehicleCategory`, `quietRide`, `ComfortProfile`.
- Produces: Vehicle category tabs, Quiet Commute toggle, visual badges on cards.

- [ ] **Step 1: Add Vehicle Tier pills (All, 🚗 Standard, 🚙 SUV, 🚐 Van) and Quiet Ride checkbox in `SearchView.tsx`**
- [ ] **Step 2: Add Quiet Commute toggle in `PublishRideView.tsx`**
- [ ] **Step 3: Add Vehicle Category and Quiet Commute badges in `RideCardItem.tsx`**
- [ ] **Step 4: Verify build and search filtering**
- [ ] **Step 5: Commit changes**

---

### Task 5: Driver "Start Journey" & Live Boarding Pass En-Route Tracker
**Files:**
- Modify: `src/views/YourRidesView.tsx`
- Modify: `src/components/RidePassModal.tsx`
- Modify: `src/domain/sharing.ts`

**Interfaces:**
- Consumes: `journeyStatus`, `isBookingForOther`, `passengerPhone`.
- Produces: "Start Journey" driver button, "🟢 Driver En Route" passenger live pill, guest-aware WhatsApp share.

- [ ] **Step 1: Add "🚀 Start Journey" button for drivers in `YourRidesView.tsx`**
- [ ] **Step 2: Add "🟢 Driver En Route / Departed Origin" live status indicator in `RidePassModal.tsx` and `YourRidesView.tsx`**
- [ ] **Step 3: Update `src/domain/sharing.ts` to coordinate with guest passenger phone/name**
- [ ] **Step 4: Run full test suite: `npm test`**
- [ ] **Step 5: Run production build: `npm run build`**
- [ ] **Step 6: Push to GitHub `main` for automatic Cloudflare deployment**
