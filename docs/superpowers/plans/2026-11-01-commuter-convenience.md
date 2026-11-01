# Sri Lankan Commuter Convenience & Safety Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 1-click WhatsApp pickup coordination, exact Google Maps landmark directions, 1-tap "Share My Trip" safety dispatch, an offline Digital Ride Pass, 1-click return trip publishing, and luggage capacity indicators.

**Architecture:** Extend domain layer with pure sharing and navigation helpers (`src/domain/sharing.ts`), extract store persistence helpers (`src/state/persistence.ts`) to maintain <800 lines in `store.ts`, add atomic return trip creation and luggage tiers in `src/state/store.ts`, and deliver accessible UI in `src/components/RidePassModal.tsx`, `PublishRideView.tsx`, and `RideCardItem.tsx`.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide icons, Emil Kowalski's `sonner` toasts, Web Share API (`navigator.share`), Vitest.

**Spec:** [`docs/superpowers/specs/2026-11-01-commuter-convenience-design.md`](file:///c:/Users/DELL/Downloads/blabla%20new/blablacar-lk/docs/superpowers/specs/2026-11-01-commuter-convenience-design.md)

## Global Constraints
- Maximum 800 lines per source file (ECC Rule). `src/state/store.ts` must stay under 750 lines.
- Immutable state updates only.
- Strict normalization of phone numbers to numeric E.164 digits for `wa.me` links.
- All file links must use `file:///` format.
- Conventional Commits: `feat:`, `refactor:`, `test:`, `docs:`.

## Review Focus
1. **User cancels native share sheet (`AbortError`)**: Must return cleanly without error toast or fallback clipboard copy.
2. **Return trip departure before outbound arrival + 30m**: Must reject with clear validation error.
3. **Phone number formats for WhatsApp**: Numbers with spaces, dashes, or `+` (e.g. `+94 77 123 4567`) must normalize to `94771234567`.
4. **Intermediate stops on return trip**: Must strictly follow reversed corridor sequence.
5. **Legacy or undefined luggage capacity**: Must fallback gracefully to `'medium'`.

---

### Task 1: Store Refactoring & Domain Types Preparation

**Files:**
- Create: `src/state/persistence.ts`
- Modify: `src/state/types.ts`
- Modify: `src/state/store.ts:1-780`
- Test: `tests/store.test.ts`

**Interfaces:**
- Consumes: `SEEDED_USERS`, `UserProfile`, `OtpChallenge` from `src/state/types.ts`.
- Produces: 
  - `loadPersistedAuth(fallback: UserProfile): { currentUser: UserProfile | null; registeredUsers: Record<string, UserProfile> }`
  - `persistAuth(currentUser: UserProfile | null, registeredUsers: Record<string, UserProfile>): void`
  - `LuggageCapacity = 'small' | 'medium' | 'large'`
  - `Booking = BookingRecord`
  - Extended `PublishRideInput` with `returnTripEnabled?: boolean; returnDate?: string; returnTime?: string; luggageCapacity?: LuggageCapacity;`

- [ ] **Step 1: Write failing test in `tests/persistence.test.ts`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { loadPersistedAuth, persistAuth } from '../src/state/persistence';
import { SEEDED_USERS } from '../src/state/types';

describe('auth persistence helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists and restores authenticated user and registered user dictionary', () => {
    const user = SEEDED_USERS['ashan-1'];
    persistAuth(user, { [user.id]: user });
    const restored = loadPersistedAuth(user);
    expect(restored.currentUser?.id).toBe(user.id);
    expect(restored.registeredUsers[user.id].name).toBe('Ashan Jayawardena');
  });

  it('restores null currentUser when user logged out', () => {
    persistAuth(null, {});
    const restored = loadPersistedAuth(SEEDED_USERS['ashan-1']);
    expect(restored.currentUser).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/persistence.test.ts`  
Expected: FAIL with "Cannot find module '../src/state/persistence'"

- [ ] **Step 3: Implement `src/state/persistence.ts`, update `src/state/types.ts` and refactor `src/state/store.ts`**

Extract `loadPersistedAuth` and `persistAuth` to `src/state/persistence.ts`.  
In `src/state/types.ts`, export `LuggageCapacity` and `Booking`.  
Import helpers into `src/state/store.ts`. Ensure `store.ts` drops from 780 lines to <745 lines.

- [ ] **Step 4: Run tests to verify all pass**

Run: `npm test`  
Expected: PASS across all test suites.

- [ ] **Step 5: Commit**

```bash
git add src/state/persistence.ts src/state/types.ts src/state/store.ts tests/persistence.test.ts
git commit -m "refactor: extract auth persistence and declare luggage & booking types"
```

---

### Task 2: Sharing & Navigation Domain Utilities

**Files:**
- Create: `src/domain/sharing.ts`
- Test: `tests/sharing.test.ts`

**Interfaces:**
- Consumes: `Ride`, `BookingRecord`, `UserProfile` from `src/state/types.ts`.
- Produces:
  - `buildWhatsAppCoordinationUrl(driverPhone: string, ride: Ride, booking: BookingRecord, landmark: string): string`
  - `buildGoogleMapsLandmarkUrl(landmarkName: string, hubLat?: number, hubLng?: number): string`
  - `deriveBoardingPin(bookingId: string): string`
  - `buildSafetyShareText(ride: Ride, booking: BookingRecord, driver: UserProfile): string`
  - `shareTripDetails(text: string): Promise<{ success: boolean; method: 'native' | 'clipboard' | 'cancelled' }>`

- [ ] **Step 1: Write failing tests in `tests/sharing.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import {
  buildWhatsAppCoordinationUrl,
  buildGoogleMapsLandmarkUrl,
  deriveBoardingPin,
  buildSafetyShareText,
} from '../src/domain/sharing';
import type { Ride, BookingRecord, UserProfile } from '../src/state/types';

describe('sharing & navigation domain', () => {
  const dummyRide: Ride = {
    id: 'ride-1',
    driverId: 'driver-1',
    originHubId: 'colombo',
    destinationHubId: 'galle',
    originName: 'Colombo',
    destinationName: 'Galle',
    departureTime: '2026-11-05T08:00:00+05:30',
    corridorId: 'e01-southern-expressway',
    corridorCode: 'E01',
    totalDistanceKm: 116,
    durationMinutes: 95,
    availableSeats: 3,
    pricePerSeatLkr: 2500,
    tollPolicy: 'included',
    estimatedTollLkr: 400,
    vehicleModel: 'Toyota Aqua - Silver',
    stops: [],
  };

  const dummyBooking: BookingRecord = {
    id: 'booking-892419',
    rideId: 'ride-1',
    passengerId: 'user-1',
    passengerName: 'Kamal Perera',
    passengerPhone: '+94711112222',
    seatsBooked: 2,
    totalPriceLkr: 5000,
    pickupLandmark: 'Makumbura MMC E01 Bay',
    dropoffLandmark: 'Pinnaduwa Interchange',
    status: 'confirmed',
    createdAt: '2026-11-01T10:00:00+05:30',
  };

  const dummyDriver: UserProfile = {
    id: 'driver-1',
    name: 'Ashan Jayawardena',
    phone: '+94 77 234 5678',
    avatarUrl: '',
    rating: 4.9,
    ridesCount: 42,
    isSuperDriver: true,
    verifiedPhone: true,
  };

  it('normalizes phone number to pure digits in wa.me link', () => {
    const url = buildWhatsAppCoordinationUrl(dummyDriver.phone, dummyRide, dummyBooking, 'Makumbura MMC');
    expect(url).toContain('https://wa.me/94772345678?text=');
    expect(url).toContain('Makumbura%20MMC');
    expect(url).toContain('Kamal%20Perera');
  });

  it('generates Google Maps coordinate URL when lat/lng are provided', () => {
    const url = buildGoogleMapsLandmarkUrl('Makumbura MMC', 6.8412, 79.9684);
    expect(url).toBe('https://www.google.com/maps/search/?api=1&query=6.8412%2C79.9684');
  });

  it('derives a clean 4-digit boarding pin', () => {
    const pin = deriveBoardingPin('booking-892419');
    expect(pin).toBe('2419');
  });

  it('builds comprehensive safety share text with driver details and boarding pin', () => {
    const text = buildSafetyShareText(dummyRide, dummyBooking, dummyDriver);
    expect(text).toContain('🛡️ Yamu Trip Share');
    expect(text).toContain('Colombo');
    expect(text).toContain('Galle');
    expect(text).toContain('Ashan Jayawardena');
    expect(text).toContain('Toyota Aqua - Silver');
    expect(text).toContain('Boarding PIN: #2419');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/sharing.test.ts`  
Expected: FAIL with "Cannot find module '../src/domain/sharing'"

- [ ] **Step 3: Implement `src/domain/sharing.ts`**

Implement URL builders, E.164 pure-digit sanitizer (`phone.replace(/\D/g, '')`), pin generator, safety message builder, and `shareTripDetails()` with `navigator.share` / `navigator.clipboard` / `AbortError` handling.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/sharing.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/sharing.ts tests/sharing.test.ts
git commit -m "feat: add WhatsApp coordination, maps navigation, and safety share domain utilities"
```

---

### Task 3: Return Trip & Luggage Store Logic with Turnaround Validation

**Files:**
- Modify: `src/state/store.ts`
- Modify: `src/state/seededRides.ts`
- Test: `tests/returnRide.test.ts`

**Interfaces:**
- Consumes: `findRouteOptions`, `getHubById` from `src/domain/corridors.ts`.
- Produces:
  - `store.publishRide(input)` handles `returnTripEnabled`: creates both outbound and return rides, validates `returnDeparture >= outboundArrival + 30m`.
  - Populates `luggageCapacity` (`'small' | 'medium' | 'large'`) on created and seeded rides.

- [ ] **Step 1: Write failing tests in `tests/returnRide.test.ts`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useMarketplaceStore } from '../src/state/store';
import { SEEDED_USERS } from '../src/state/types';

describe('return trip publishing & luggage capacity', () => {
  beforeEach(() => {
    useMarketplaceStore.setState({
      currentUser: SEEDED_USERS['ashan-1'],
      rides: [],
      bookings: [],
    });
  });

  it('publishes single ride with luggage capacity', () => {
    const store = useMarketplaceStore.getState();
    const result = store.publishRide({
      originHubId: 'colombo',
      destinationHubId: 'galle',
      corridorId: 'e01-southern-expressway',
      date: '2026-11-10',
      departureTime: '08:00',
      availableSeats: 3,
      clampedPriceLkr: 2500,
      tollPolicy: 'included',
      pickupLandmark: 'Fort Station',
      dropoffLandmark: 'Galle Fort',
      comfort: { maxTwoInBack: true, womenOnly: false, quiet: false, ac: true, luggage: 'large' },
      luggageCapacity: 'large',
    });

    expect(result.ok).toBe(true);
    const rides = useMarketplaceStore.getState().rides;
    expect(rides).toHaveLength(1);
    expect(rides[0].luggageCapacity).toBe('large');
  });

  it('publishes outbound and return trip atomically when returnTripEnabled is true', () => {
    const store = useMarketplaceStore.getState();
    const result = store.publishRide({
      originHubId: 'colombo',
      destinationHubId: 'galle',
      corridorId: 'e01-southern-expressway',
      date: '2026-11-10',
      departureTime: '08:00',
      availableSeats: 3,
      clampedPriceLkr: 2500,
      tollPolicy: 'included',
      pickupLandmark: 'Fort Station',
      dropoffLandmark: 'Galle Fort',
      comfort: { maxTwoInBack: true, womenOnly: false, quiet: false, ac: true, luggage: 'medium' },
      luggageCapacity: 'medium',
      returnTripEnabled: true,
      returnDate: '2026-11-12',
      returnTime: '17:00',
    });

    expect(result.ok).toBe(true);
    const rides = useMarketplaceStore.getState().rides;
    expect(rides).toHaveLength(2);

    const outbound = rides[0];
    const returnRide = rides[1];

    expect(outbound.originHubId).toBe('colombo');
    expect(outbound.destinationHubId).toBe('galle');
    expect(returnRide.originHubId).toBe('galle');
    expect(returnRide.destinationHubId).toBe('colombo');
    expect(returnRide.departureTime).toContain('2026-11-12T17:00');
    expect(returnRide.pickupLandmark).toBe('Galle Fort');
    expect(returnRide.dropoffLandmark).toBe('Fort Station');
    expect(returnRide.pricePerSeatLkr).toBe(2500);
    expect(returnRide.corridorId).toBe('e01-southern-expressway');
  });

  it('rejects return trip scheduled before outbound arrival + 30m', () => {
    const store = useMarketplaceStore.getState();
    const result = store.publishRide({
      originHubId: 'colombo',
      destinationHubId: 'galle',
      corridorId: 'e01-southern-expressway',
      date: '2026-11-10',
      departureTime: '08:00', // Arrives at 09:35
      availableSeats: 3,
      clampedPriceLkr: 2500,
      tollPolicy: 'included',
      pickupLandmark: 'Fort Station',
      dropoffLandmark: 'Galle Fort',
      comfort: { maxTwoInBack: true, womenOnly: false, quiet: false, ac: true, luggage: 'medium' },
      returnTripEnabled: true,
      returnDate: '2026-11-10',
      returnTime: '09:00', // Impossible return departure
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('30 minutes');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/returnRide.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement atomic return ride and luggage capacity in `src/state/store.ts`**

In `store.publishRide`:
1. Save `luggageCapacity: input.luggageCapacity ?? input.comfort.luggage ?? 'medium'`.
2. If `input.returnTripEnabled`:
   - Validate return date and time presence.
   - Calculate outbound arrival timestamp; ensure `returnDeparture >= outboundArrival + 30 * 60 * 1000`.
   - Call `findRouteOptions(input.destinationHubId, input.originHubId)` and select the matching `input.corridorId`.
   - Create return ride with mirrored origin/destination, swapped landmarks, same comfort, and same price.
   - Prepend both rides to store.
3. Update `src/state/seededRides.ts` with explicit `luggageCapacity` on seeded rides.
4. Verify `store.ts` file length remains strictly under 750 lines.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/returnRide.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/state/store.ts src/state/seededRides.ts tests/returnRide.test.ts
git commit -m "feat: implement atomic return ride publishing and luggage capacity in store"
```

---

### Task 4: Digital Ride Pass Modal Component

**Files:**
- Create: `src/components/RidePassModal.tsx`
- Modify: `src/views/RideDetailView.tsx`
- Modify: `src/views/YourRidesView.tsx`

**Interfaces:**
- Consumes: `Ride`, `BookingRecord`, `UserProfile` from `src/state/types.ts`, `buildWhatsAppCoordinationUrl`, `buildGoogleMapsLandmarkUrl`, `deriveBoardingPin`, `buildSafetyShareText`, `shareTripDetails` from `src/domain/sharing.ts`.
- Produces: Accessible dialog component `<RidePassModal isOpen={boolean} onClose={() => void} ride={Ride} booking={BookingRecord} driver={UserProfile} />`.

- [ ] **Step 1: Create `src/components/RidePassModal.tsx`**

Build the digital boarding pass modal:
- High contrast header with Yamu brand styling and route pill (`Colombo ➔ Galle`).
- Boarding PIN callout (`Boarding PIN: #2419`) with safety instruction: *"Show this code to driver upon boarding"*.
- Departure time, seats booked, and total LKR.
- Driver card with avatar, rating, phone, vehicle model, and verified phone badge.
- Action Buttons:
  - 🟢 **WhatsApp Driver** (opens `wa.me` in new tab).
  - 📍 **Pickup Directions** (opens Google Maps landmark link).
  - 🛡️ **Share with Family** (calls `shareTripDetails()` with `sonner` toast confirmation).
- Offline banner: *"✓ Saved on device — accessible without internet"*.

- [ ] **Step 2: Wire `RidePassModal` into `RideDetailView.tsx`**

In `RideDetailView.tsx`:
- When a booking is confirmed, display a primary action: `"View Digital Ride Pass"`.
- Clicking it opens `<RidePassModal />`.
- Also show quick action icons for WhatsApp driver and Google Maps pickup directions.

- [ ] **Step 3: Wire `RidePassModal` into `YourRidesView.tsx`**

In `YourRidesView.tsx`:
- On each confirmed booking card under "Booked Rides", add a prominent `"Digital Ride Pass"` button that opens the modal.

- [ ] **Step 4: Run tests & verify type-check**

Run: `npm run build`  
Expected: 0 TypeScript errors, successful build.

- [ ] **Step 5: Commit**

```bash
git add src/components/RidePassModal.tsx src/views/RideDetailView.tsx src/views/YourRidesView.tsx
git commit -m "feat: add offline Digital Ride Pass modal with WhatsApp and Maps quick actions"
```

---

### Task 5: Publisher Wizard UI & Ride Card Enhancements

**Files:**
- Modify: `src/views/PublishRideView.tsx`
- Modify: `src/components/RideCardItem.tsx`

**Interfaces:**
- Consumes: `LuggageCapacity` from `src/state/types.ts`.
- Produces:
  - 3-tier Luggage Capacity selector in `PublishRideView.tsx`.
  - "🔄 Publish Return Trip" toggle in Step 6 of `PublishRideView.tsx` with date/time pickers and auto-sync.
  - Compact luggage badge in `RideCardItem.tsx` (`🎒 Small bag`, `🧳 Medium luggage`, `✈️ Airport luggage`).

- [ ] **Step 1: Add Luggage Selector to `PublishRideView.tsx`**

In Step 3 (Vehicle & Preferences):
- Add a 3-button segmented selector for `luggageCapacity`:
  - `🎒 Small (Backpack only)`
  - `🧳 Medium (Standard suitcase)`
  - `✈️ Large (Multiple/Airport bags)`
- Bind to state and pass to `store.publishRide()`.

- [ ] **Step 2: Add Return Trip Publishing Toggle to `PublishRideView.tsx`**

In Step 6 (Review & Publish):
- Add accordion/card: *"🔄 Publish Return Trip in 1 Click"*.
- Checkbox: *"Also publish return trip from [Destination] to [Origin]"*.
- When checked:
  - Return Date picker (defaults to Outbound Date + 2 days, min is Outbound Date).
  - Return Departure Time picker (defaults to 17:00).
  - Auto-sync return date if outbound date changes past it.
  - Remove previous redundant manual duplicate publishing code (lines 125-155), letting `store.publishRide()` handle both atomically.
- Verify `PublishRideView.tsx` stays under 720 lines.

- [ ] **Step 3: Add Luggage Badge to `RideCardItem.tsx`**

In `RideCardItem.tsx`:
- Render a luggage badge alongside `Max 2 in back` and `AC`:
  - Small: `🎒 Small bag`
  - Medium: `🧳 Luggage ok`
  - Large: `✈️ Airport bags`
- Verify `RideCardItem.tsx` stays under 170 lines.

- [ ] **Step 4: Full verification across test suite and production build**

Run: `npm test && npm run build`  
Expected: 100% passing tests, 0 TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/views/PublishRideView.tsx src/components/RideCardItem.tsx
git commit -m "feat: add luggage selector and return trip publishing toggle to wizard and cards"
```
