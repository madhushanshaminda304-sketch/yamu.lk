# BlaBlaCar Sri Lanka (`blablacar-lk`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone, reverse-engineered Sri Lankan BlaBlaCar carpooling marketplace (`blablacar-lk`) with corridor & Boost stopover matching, LKR distance-capped cost-sharing, Instant/Manual booking, Sri Lankan NIC & Super Driver verification, anti-scam chat, double-blind ratings, and trilingual (`en-LK`, `si-LK`, `ta-LK`) UI.

**Architecture:** Deep domain modules in `src/domain/` (`corridors`, `pricing`, `matching`, `trust`, `scamGuard`, `i18n`) isolate all routing, proportional segment capacity, LKR cost-sharing bounds, verification rules, and scam detection behind pure, unit-tested TypeScript functions. A reactive persistent store (`src/state/store.ts`) and Kairos-styled React 19 SPA (`src/App.tsx`) wire these modules into the 6 core marketplace flows, backed by a PostgreSQL/Supabase schema (`supabase/schema.sql`).

**Tech Stack:** TypeScript 5, React 19, React Router 7, Vite 6, Phosphor Icons, Node.js native test runner (`node --test` with `--experimental-strip-types`), PostgreSQL / Supabase SQL.

**Spec:** `docs/superpowers/specs/2026-11-01-blablacar-sri-lanka-design.md`

## Global Constraints

- Currency is always Sri Lankan Rupees (`LKR` / `Rs.`), stepped in increments of `LKR 50`, with hard cost-sharing bounds (`75%` floor to `125%` ceiling of the distance-anchored recommendation, minimum `LKR 150`).
- Timezone is `Asia/Colombo` (`UTC+05:30`).
- Sri Lankan mobile numbers must match `^\+947[0-9]{8}$`; Sri Lankan NIC numbers must match either `^[0-9]{9}[vVxX]$` (old format) or `^[0-9]{12}$` (new format).
- Vehicle categories are restricted to private cars, SUVs, and family vans (no commercial buses or three-wheelers/tuk-tuks).
- All domain updates must be immutable (returning new objects/arrays rather than mutating inputs in place).

## Review Focus

- **Overlapping partial-leg ("Boost") bookings**: Two passengers booking non-overlapping legs (e.g., `Colombo → Dodangoda` and `Dodangoda → Galle`) share the same physical seat without conflict, whereas overlapping legs (`Colombo → Galle` and `Dodangoda → Matara`) must decrement shared segment capacity and reject overbooking when remaining segment seats < requested seats.
- **Cost-sharing Contribution Cap enforcement**: Attempting to publish or step a seat contribution above `maxLkr` (+25% of recommended) must clamp to `maxLkr` and reject out-of-range overrides.
- **Sri Lankan NIC & Phone validation**: Invalid NICs (e.g., 10 digits, wrong suffix) or non-`+947` phone numbers must fail verification cleanly.
- **Anti-scam chat link blocking**: Messages containing external URLs (`http://`, `https://`, `bit.ly`, payment links) or card/advance-transfer solicitation must be flagged and blocked by `inspectChatMessage`.
- **14-day Double-Blind Rating visibility**: A submitted rating must remain hidden (`visible: false`) until the counterparty also submits their rating for the booking or 14 days have elapsed since trip arrival.

---

### Task 1: Project Scaffolding, Sri Lankan Corridors & Distance-Anchored LKR Pricing Engine

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/domain/corridors.ts`
- Create: `src/domain/pricing.ts`
- Test: `tests/corridors-pricing.test.ts`

**Interfaces:**
- Consumes: none
- Produces:
  - `Hub`: `{ id: string; name: { en: string; si: string; ta: string }; district: string; landmarks: string[]; isExpresswayInterchange?: boolean }`
  - `Corridor`: `{ id: string; code: string; name: string; hasTolls: boolean; defaultTollLkr: number; stops: { hubId: string; kmFromStart: number; minutesFromStart: number }[] }`
  - `findRouteOptions(originHubId: string, destinationHubId: string): RouteOption[]`
  - `calculateRecommendedLkr(distanceKm: number, tollPolicy: 'included' | 'split_at_gate' | 'no_tolls', estimatedTollLkr?: number): number`
  - `getContributionBounds(recommendedLkr: number): { minLkr: number; recommendedLkr: number; maxLkr: number; stepLkr: 50 }`
  - `getPriceBand(priceLkr: number, recommendedLkr: number): 'green' | 'amber' | 'red'`
  - `stepContributionLkr(currentLkr: number, deltaSteps: number, bounds: { minLkr: number; maxLkr: number }): number`
  - `calculateLegContribution(fullRidePriceLkr: number, fullDistanceKm: number, legDistanceKm: number): number`

- [ ] **Step 1: Write the failing test in `tests/corridors-pricing.test.ts`**

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import { findRouteOptions, getHubById } from '../src/domain/corridors.ts';
import {
  calculateRecommendedLkr,
  getContributionBounds,
  getPriceBand,
  stepContributionLkr,
  calculateLegContribution,
} from '../src/domain/pricing.ts';

test('findRouteOptions returns Expressway (E01 Tolls) and Coastal (A2 No Tolls) between Colombo and Galle', () => {
  const routes = findRouteOptions('colombo', 'galle');
  assert.ok(routes.length >= 2);
  const e01 = routes.find((r) => r.hasTolls);
  const a2 = routes.find((r) => !r.hasTolls);
  assert.ok(e01);
  assert.ok(a2);
  assert.ok(e01.durationMinutes < a2.durationMinutes);
  assert.ok(e01.intermediateHubs.includes('dodangoda'));
});

test('LKR cost-sharing pricing enforces +/-25% bounds, LKR 50 steps, and price bands', () => {
  const rec = calculateRecommendedLkr(120, 'included', 400);
  assert.equal(rec % 50, 0);
  const bounds = getContributionBounds(rec);
  assert.equal(bounds.stepLkr, 50);
  assert.ok(bounds.minLkr <= rec && bounds.maxLkr >= rec);
  assert.equal(stepContributionLkr(bounds.maxLkr, 1, bounds), bounds.maxLkr);
  assert.equal(stepContributionLkr(bounds.minLkr, -1, bounds), bounds.minLkr);
  assert.equal(getPriceBand(rec, rec), 'green');
  assert.equal(getPriceBand(bounds.maxLkr, rec), 'red');
  const legPrice = calculateLegContribution(2500, 125, 60);
  assert.equal(legPrice % 50, 0);
  assert.ok(legPrice > 0 && legPrice < 2500);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types tests/corridors-pricing.test.ts`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `src/domain/corridors.ts` and `src/domain/pricing.ts`**

Create `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, and implement the 28 Sri Lankan Hubs, 7 major trunk corridors (`E01`, `A2`, `E04/A1`, `A1`, `E03/A3`, `A9`, `A6/East`), and pure LKR pricing functions.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types tests/corridors-pricing.test.ts`
Expected: PASS

---

### Task 2: Corridor Segment Capacity, Boost Partial-Leg Matching & Smart Tags

**Files:**
- Create: `src/domain/matching.ts`
- Test: `tests/matching.test.ts`

**Interfaces:**
- Consumes: `Hub`, `Corridor` from `src/domain/corridors.ts`, `calculateLegContribution` from `src/domain/pricing.ts`
- Produces:
  - `RideStop`: `{ hubId: string; stopIndex: number; arrivalAt: string; departureAt: string; kmFromOrigin: number; priceFromOriginLkr: number; pickupLandmark: string; isBoostStop?: boolean }`
  - `Ride`: full ride entity with `stops: RideStop[]`, `segmentSeatsAvailable: number[]`, `approvalMode: 'instant' | 'manual'`, `comfort: ComfortProfile`, `driver: DriverSummary`
  - `canBookLeg(ride: Ride, fromHubId: string, toHubId: string, seatsRequested: number): { allowed: boolean; fromIndex: number; toIndex: number; availableSeatsOnLeg: number; legPriceLkr: number; isBoostLeg: boolean; reason?: string }`
  - `applyLegBooking(ride: Ride, fromIndex: number, toIndex: number, seats: number): Ride`
  - `releaseLegBooking(ride: Ride, fromIndex: number, toIndex: number, seats: number): Ride`
  - `searchRides(rides: Ride[], query: SearchQuery): MatchedRideResult[]`
  - `assignSmartTags(results: MatchedRideResult[]): MatchedRideResult[]`

- [ ] **Step 1: Write the failing test in `tests/matching.test.ts`**

Test non-overlapping Boost legs (`Colombo → Kurundugahahetekma` + `Kurundugahahetekma → Matara` sharing 1 seat) vs overlapping legs (`Colombo → Galle` + `Dodangoda → Matara` rejecting when only 1 seat remains), plus `Cheapest`, `Earliest`, `Fastest`, and `Women Only` filtering.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types tests/matching.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `src/domain/matching.ts`**

Implement immutable segment capacity arrays (`segmentSeatsAvailable` of length `stops.length - 1`), `canBookLeg`, `applyLegBooking`, `releaseLegBooking`, `searchRides`, and `assignSmartTags`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types tests/matching.test.ts`
Expected: PASS

---

### Task 3: Sri Lankan Trust, NIC/Phone Validation, Super Driver, Double-Blind Ratings & Anti-Scam Guard

**Files:**
- Create: `src/domain/trust.ts`
- Create: `src/domain/scamGuard.ts`
- Create: `src/domain/i18n.ts`
- Test: `tests/trust-scam.test.ts`

**Interfaces:**
- Consumes: none
- Produces:
  - `validateSriLankaPhone(phone: string): boolean`
  - `validateSriLankaNic(nic: string): { valid: boolean; format?: 'old_9_vx' | 'new_12'; birthYear?: number }`
  - `evaluateSuperDriver(stats: DriverTrustStats): { isSuperDriver: boolean; unmetCriteria: string[] }`
  - `resolveRatingVisibility(rating: DoubleBlindRating, hasCounterpartyRated: boolean, nowIso: string): boolean`
  - `inspectChatMessage(text: string): { allowed: boolean; sanitizedText: string; warningCode?: 'external_link_blocked' | 'advance_payment_scam_warning' }`
  - `t(locale: LocaleCode, key: string): string` and `formatLkr(amount: number, locale?: LocaleCode): string`

- [ ] **Step 1: Write the failing test in `tests/trust-scam.test.ts`**

Test 9-digit `V/X` and 12-digit Sri Lankan NICs, `+947XXXXXXXX` phones, Super Driver 6-point criteria, 14-day double-blind rating reveal, anti-scam URL/advance-transfer blocking, and trilingual (`en-LK`, `si-LK`, `ta-LK`) translations.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types tests/trust-scam.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `src/domain/trust.ts`, `src/domain/scamGuard.ts`, and `src/domain/i18n.ts`**

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types tests/trust-scam.test.ts`
Expected: PASS

---

### Task 4: Persistent Marketplace Store, Seeded Sri Lankan Dataset & Supabase Schema

**Files:**
- Create: `src/state/store.ts`
- Create: `supabase/schema.sql`
- Test: `tests/store.test.ts`

**Interfaces:**
- Consumes: `src/domain/corridors.ts`, `src/domain/pricing.ts`, `src/domain/matching.ts`, `src/domain/trust.ts`, `src/domain/scamGuard.ts`
- Produces:
  - `createMarketplaceStore(initialState?: MarketplaceState)` with actions: `publishRide`, `bookRideLeg`, `respondToBooking`, `cancelBooking`, `createRideAlert`, `sendMessage`, `submitDoubleBlindRating`, `verifySriLankanIdentity`

- [ ] **Step 1: Write the failing test in `tests/store.test.ts`**

Test end-to-end store workflows: publishing a new ride with stopovers triggers matching `RideAlert` notifications, Instant Booking immediately decrements leg capacity, Manual Request reserves capacity only on driver acceptance, sending a scam link in chat is blocked, and double-blind ratings unlock once both parties rate.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types tests/store.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `src/state/store.ts` and `supabase/schema.sql`**

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types tests/store.test.ts`
Expected: PASS

---

### Task 5: Kairos-Inspired BlaBlaCar Sri Lanka Frontend (`src/App.tsx`, `src/styles.css`, `src/main.tsx`)

**Files:**
- Create: `src/styles.css`
- Create: `src/App.tsx`
- Create: `src/main.tsx`

**Interfaces:**
- Consumes: `src/state/store.ts` and all `src/domain/*` modules
- Produces: Complete responsive SPA with:
  1. **Trilingual Header (`EN · සිං · தமிழ்`) & Navigation**
  2. **Home & Search Hero**: Origin/Destination Hub autocomplete across 28 Sri Lankan hubs, 1-click swap, date, passenger stepper, Popular Sri Lankan Corridors (`Colombo → Kandy`, `Makumbura → Galle`, `Colombo → Jaffna`, `Kandy → Ella`, `Colombo → Katunayake Airport`), Super Driver spotlight, and Anti-Scam education banner.
  3. **Search Results & Boost Stopover Timeline**: Smart tags (`Cheapest`, `Earliest`, `Fastest`, `Boost Stopover`), comprehensive sidebar filters (Sort, Departure time window, Max LKR slider, Instant Booking, Super Driver, Verified Profile, Max 2 in the back, Women Only, AC, Pets), and 1-click **Create a Ride Alert** when searching sparse dates/routes.
  4. **Ride Detail & Partial-Leg Booking**: Visual stopover timeline highlighting the passenger's boarding & alighting hubs, proportional LKR leg contribution, Expressway Toll badge, Driver Verification & Super Driver card, Comfort Profile (`Bla/BlaBla/BlaBlaBla`, Max 2 in back, AC, Luggage, Music, Pets, Smoking, Women Only), Onboard Cash / LankaQR settlement summary, and anti-scam disclaimer.
  5. **6-Step Conversational Publish Wizard**: Step 1 (Origin, Destination & Landmark Meeting Points) → Step 2 (Route Option: Expressway Tolls vs Standard A-Road + Declared Stopovers & Boost toggle) → Step 3 (Departure Date/Time & Return Ride option) → Step 4 (Seats, Vehicle & "Max. 2 in the back" / Women Only / AC toggles) → Step 5 (Interactive LKR Cost-Sharing Stepper `± Rs. 50` with Green/Amber/Red Price Band & Hard Cap enforcement) → Step 6 (Approval Mode: Instant Booking vs Manual Approval + Ride Comment).
  6. **My Rides, Bookings, Anti-Scam Chat & Double-Blind Ratings + Profile Verification**: Manage passenger/driver bookings, accept/decline manual requests, chat with built-in scam-link blocker + WhatsApp deep-link, submit 14-day double-blind ratings, and verify Sri Lankan NIC + `+94` mobile OTP.

- [ ] **Step 1: Implement `src/styles.css`, `src/App.tsx`, and `src/main.tsx`**
- [ ] **Step 2: Run full unit test suite and production TypeScript + Vite build**

Run: `npm test && npm run build`
Expected: All tests PASS and Vite production bundle builds with zero TypeScript errors.
