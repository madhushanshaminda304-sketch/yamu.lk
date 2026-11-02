# Yandex Go Taxi Advanced Features Adaptation for Yamo Sri Lanka — Architecture & Design

## 1. Intent & Why
Following reverse-engineering of the decompiled Yandex Go Android application (`c:/Users/DELL/Downloads/yandex taxi`), this project extracts the highest-utility, commuter-tested features from Yandex Go's **Taxi & Intercity** vertical (`com.yandex.p032go.taxi.*` and `ru.yandex.taxi.*`) and adapts them to **Yamo Sri Lanka** (`yamo.lk`).

Yamo is an island-wide intercity carpooling marketplace operating on Sri Lankan highway corridors (E01, E04, A1, A2, A9). Unlike commercial on-demand taxis, Yamo operates strictly within legal private cost-sharing limits (LKR ~20/km + tolls, max +25% cap, onboard settlement via Cash or LankaQR, ADR 0002).

This design integrates six focused features that elevate rider safety, trip coordination, roadside identification, and commuter convenience without introducing commercial taxi mechanisms (such as surge pricing, taximeters, or price bidding):

1. **Driver Journey Lifecycle ("Start Journey" / "Arrive" / "Complete") & Quick Coordination Chat Chips**
2. **Color-Coded Sri Lankan Vehicle Plate Badge (`CarPlateBadge`)**
3. **Safety Center & Trusted Emergency Contacts Drawer (`119`, `1990`, `1969`, WhatsApp SOS)**
4. **Saved Favorite Places & Express Commute Shortcuts (`Home`, `Work`, `University`)**
5. **Special Trip Requirements (`Child Seat`, `Wheelchair/Elderly Assist`, `Airport Transit`)**
6. **Post-Trip "Forgotten Items" Recovery Modal**

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
1. **Driver Journey Lifecycle Execution**:
   - Provide explicit Driver controls in `YourRidesView.tsx` to transition a ride from `scheduled` → `departed` → `completed`.
   - On `departed`, notify passengers and display live `🟢 Driver En Route` badges across cards and the digital Ride Pass.
   - On `completed`, mark the ride completed and surface immediate mutual rating prompts.
2. **1-Tap Quick Coordination Chat Chips**:
   - Add contextual, pre-verified message chips in `YourRidesView.tsx` chat and `InboxView.tsx` (e.g. *"I'm at the landmark"*, *"Running 5 mins late"*, *"Waiting near main entrance"*, *"Arrived in silver Aqua"*) to eliminate typing while driving or walking.
3. **Sri Lankan Vehicle Plate Badge (`CarPlateBadge`)**:
   - Create an authentic Sri Lankan license plate UI component (`WP | CAB-1234` format) rendered on `RideCardItem`, `RideDetailView`, and `RidePassModal` for unambiguous roadside identification at crowded multi-modal transit hubs.
   - Support masked plates (`WP CAB-••••`) on public search results to protect driver privacy, and full unmasked plates on confirmed `RidePassModal` and booking details.
4. **Safety Center & Trusted Contacts**:
   - Allow members to save 1–2 emergency trusted contacts in their Profile (`name`, `phone`, `relationship`).
   - Introduce a persistent Safety Center modal on active bookings featuring 1-tap dialers for Sri Lankan emergency services (`119` Police, `1990` Suwa Seriya Ambulance, `1969` Expressway Operations) and 1-tap WhatsApp SOS trip share with live driver details and boarding PIN.
5. **Saved Favorite Places & Express Commute Shortcuts**:
   - Enable users to save favorite commute endpoints (`Home`, `Work`, `University`) with associated Hub ID and landmark.
   - Render 1-tap shortcuts on `HomeView.tsx` and `PublishRideView.tsx`: tapping a saved place pre-populates the Destination (or Origin if Destination is already set).
6. **Special Trip Requirements**:
   - Add structured indicators for `Child Seat`, `Wheelchair/Accessibility Assistance`, and `Airport BIA Transit` to ride publishing, search filtering, and ride detail badges.
7. **Post-Trip "Forgotten Items" Recovery**:
   - For completed bookings, offer a dedicated recovery flow connecting the passenger directly to the driver via phone and formatted WhatsApp recovery message citing trip details and boarding PIN.

### Non-Goals
- Real-time GPS driver telemetry / live map tracking markers (Yamo is scheduled intercity carpooling; drivers are on highway transit, not continuous WebSockets).
- Dynamic surge pricing or meter charges (explicitly prohibited under Yamo cost-sharing rules).
- In-app payment gateways or escrow wallets (onboard Cash / LankaQR settlement remains standard).
- Heavy external dependencies (zero new npm packages; all features built with React 19, TypeScript, Phosphor Icons, and Sonner).

### Anti-Goals
- Never exceed 800 lines per file (ECC architecture rule).
- Never break existing 74 unit tests in `tests/*.test.ts`.
- Never compromise anti-scam guard protections (quick chat chips must remain safe and free of phishing vectors).

---

## 3. Approaches Considered

| Approach | Description | Pros | Cons | Decision |
|---|---|---|---|---|
| **Approach A (Selected): Native In-App Modular Components in `blablacar-lk`** | Implement the 6 features as cohesive TypeScript domain modules and React 19 UI components directly in `blablacar-lk`, backed by the local/Supabase reactive store. | • Cleanest integration with existing Yamo domain models.<br>• 100% testable via Node test runner.<br>• Works seamlessly on web and Capacitor Android.<br>• Zero external dependencies or infrastructure costs. | • Requires updating state store and several existing views. | **Selected** — Delivers authentic Yandex Go ergonomics tailored strictly to Sri Lankan carpooling. |
| **Approach B: Micro-Services / Cloud Functions for Real-Time State** | Build independent backend WebSocket microservices for live tracking and state sync. | • Ultra-low latency for second-by-second updates. | • Massive operational complexity.<br>• Excessive for scheduled intercity trips.<br>• High infrastructure cost unsuitable for cost-sharing pilot. | **Rejected** |
| **Approach C: Generic Static UI Badges Only** | Only add text labels and badges without reactive store support or emergency dialers. | • Lowest implementation effort. | • Fails to provide real safety utility or live driver state.<br>• Poor user experience. | **Rejected** |

---

## 4. Detailed Architecture & Builder Decisions

### 4.1 Domain Models & State Extensions

#### `src/domain/matching.ts`
```typescript
export interface SpecialRequirements {
  childSeatAvailable?: boolean;
  wheelchairAccessible?: boolean;
  airportFlightTransfer?: boolean;
}

export interface VehicleInfo {
  makeModel: string;
  category: VehicleCategory;
  plateHint: string;     // e.g. "WP CAB-••••" (public masked)
  plateNumber?: string;  // e.g. "WP CAB-1234" (unmasked on confirmed pass)
  acGuaranteed: boolean;
}

export interface Ride {
  // Existing fields...
  journeyStatus?: 'scheduled' | 'departed' | 'completed';
  specialRequirements?: SpecialRequirements;
}

export interface SearchQuery {
  // Existing fields...
  childSeatOnly?: boolean;
  wheelchairOnly?: boolean;
  airportOnly?: boolean;
}
```

#### `src/state/types.ts`
```typescript
export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  relationship: string; // e.g. 'Family', 'Spouse', 'Friend'
}

export interface SavedPlace {
  id: string;
  label: 'home' | 'work' | 'university' | 'other';
  title: string;
  hubId: string;
  landmark: string;
}

export interface UserProfile {
  // Existing fields...
  trustedContacts?: TrustedContact[];
  savedPlaces?: SavedPlace[];
}
```

### 4.2 Resolved Builder Decisions

1. **Commute Shortcuts (`SavedPlace`)**:
   - Each shortcut is a single place (`Home`, `Work`, `University`) anchored to a Hub ID and landmark.
   - On `HomeView.tsx`, tapping a shortcut chip sets `toHubId` (destination). If `fromHubId` matches `toHubId`, `fromHubId` is set to the nearest GPS hub or Colombo default.
   - An indicator clearly says: *"Heading to Work: Makumbura MMC"*.

2. **Car Plate Privacy (`CarPlateBadge`)**:
   - Public search results (`RideCardItem`) render the plate masked (`WP CAB-••••`) to protect driver privacy.
   - Confirmed passengers on `RidePassModal` and `RideDetailView` (when booked) see the full unmasked plate (`WP CAB-1234`).
   - Drivers input the full plate during publish or profile vehicle setup; the system automatically derives `plateHint`.

3. **Journey Status & Booking Status**:
   - `Ride.journeyStatus` transitions `scheduled` → `departed` → `completed`.
   - `BookingRecord.status` remains `'accepted'` to preserve backwards compatibility across queries, accounting, and tests.
   - When `Ride.journeyStatus === 'completed'`, `YourRidesView.tsx` surfaces mutual rating prompts and the "Left something in car?" recovery button.

4. **Safety Center SOS Dispatch**:
   - If 1 trusted contact is saved: 1-tap opens WhatsApp directly to that contact (`wa.me/<phone>?text=...`).
   - If 2 trusted contacts: shows two buttons (`WhatsApp Amma`, `WhatsApp Thaththa`).
   - If 0 contacts: triggers native Web Share API with trip text, with copy-to-clipboard fallback.

5. **Management in Profile**:
   - `ProfileView.tsx` includes dedicated sections for:
     1. **Saved Commute Places**: Add/edit/delete Home, Work, and University hubs.
     2. **Emergency Trusted Contacts**: Add/edit/delete up to 2 emergency contacts.

6. **Airport Transit Option**:
   - Flag `airportFlightTransfer` marks rides with luggage boot space and flight readiness.
   - Searching with `airportOnly` matches rides that either have `airportFlightTransfer: true` OR pass through `katunayake` (BIA airport hub).

---

## 5. Component Architecture

### 1. `src/components/CarPlateBadge.tsx`
- Renders authentic Sri Lankan license plate:
  - Province column (`WP`, `CP`, `SP`, `NP`, etc.) on the left with a subtle vertical divider.
  - Registration letters and digits (`CAB-1234` or `CAB-••••`).
  - Monospace font, high-contrast dark border, embossed metallic style.
  - Props: `plate: string`, `isMasked?: boolean`, `size?: 'sm' | 'md'`.

### 2. `src/components/SafetyCenterModal.tsx`
- Props: `isOpen: boolean`, `onClose: () => void`, `ride: Ride`, `booking: BookingRecord`, `userProfile?: UserProfile`.
- Direct 1-tap call triggers:
  - `tel:119` (Police)
  - `tel:1990` (Suwa Seriya Ambulance)
  - `tel:1969` (Expressway Operations)
- 1-tap WhatsApp SOS dispatch to saved trusted contacts.

### 3. `src/components/ForgottenItemsModal.tsx`
- Props: `isOpen: boolean`, `onClose: () => void`, `ride: Ride`, `booking: BookingRecord`.
- Driver contact card with phone call and WhatsApp button.
- Generates pre-formatted retrieval message:
  `"Hi [Driver], I was a passenger on your Yamo ride from [From] to [To] on [Date] (PIN #[PIN]). I think I left an item in your car ([Vehicle]). Could you please let me know when you have a moment? Thank you!"`

---

## 6. View Integrations

- **`YourRidesView.tsx`**:
  - Driver Tab: "🚀 Start Journey" (moves to `departed`), "🏁 Complete Journey" (moves to `completed`).
  - Passenger Tab: "🟢 Driver En Route" indicator, "🎒 Left something in car?" post-trip recovery button.
  - Chat Drawer: Quick coordination chips (`"At the pickup landmark"`, `"Running 5 mins late"`, `"In a white shirt"`, `"Arrived in Aqua"`).
- **`HomeView.tsx` & `PublishRideView.tsx`**:
  - Horizontal shortcut chips for Saved Places (`Home`, `Work`, `Campus`).
- **`SearchView.tsx`**:
  - Quick filter chips for `💺 Child Seat`, `♿ Wheelchair/Accessible`, `✈️ Airport Transit`.
- **`RidePassModal.tsx`**:
  - Prominent `CarPlateBadge` (full unmasked plate).
  - Prominent `🛡️ Safety Center` button.
- **`ProfileView.tsx`**:
  - Management UI for Saved Places and Trusted Contacts.

---

## 7. Testing Strategy
- Unit tests in `tests/yandex_features.test.ts`:
  - `CarPlateBadge` formatting and masking.
  - Store actions for `journeyStatus`, `trustedContacts`, and `savedPlaces`.
  - Search query filtering with special requirements.
  - Emergency SOS message text and Forgotten Items message generation.
- All existing 74 tests in `tests/*.test.ts` must remain green.
- Zero build warnings in `npm run build`.
