# Yandex Go Taxi Advanced Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the six reverse-engineered Yandex Go Taxi features in Yamo: Sri Lankan Car Plate Badges, Driver Journey Lifecycle ("Start Journey" / "Complete Journey"), 1-Tap Coordination Chat Chips, Safety Center with Emergency Hotlines & WhatsApp SOS, Saved Commute Shortcuts, Special Requirements (Child Seat, Wheelchair, Airport Transit), and Post-Trip Forgotten Items Recovery.

**Architecture:** Extend core domain modules with plate normalization, SOS generation, and special requirements matching. Enhance reactive store with trusted contacts, saved places, and journey status notifications. Implement modular modal components (`CarPlateBadge`, `SafetyCenterModal`, `ForgottenItemsModal`) and integrate into views while strictly respecting the 800-line ceiling per file.

**Tech Stack:** React 19, TypeScript 5.7, Phosphor Icons, Sonner Toasts, Node Test Runner, Vite 6.

**Spec:** [`docs/superpowers/specs/2026-11-02-yandex-taxi-features-design.md`](../specs/2026-11-02-yandex-taxi-features-design.md)

## Global Constraints
- Brand name: strictly **Yamo** (`yamo.lk`).
- Theme colors: Ceylon Emerald (`#047857`), Deep Pine (`#064e3b`), Amber Gold (`#f59e0b`).
- Every source file must remain strictly under 800 lines (ECC rule).
- All 74 existing unit tests must remain completely green.
- Zero npm package additions (100% vanilla React 19 + TypeScript).
- Zero build warnings in `npm run build`.

## Review Focus
1. Plate masking: Public search results must only display masked plates (`WP CAB-••••`); full unmasked plates (`WP CAB-1234`) are revealed only on confirmed booking passes.
2. WhatsApp SOS & Recovery text formatting: must encode phone numbers into clean international `94XXXXXXXXX` format and include verifiable boarding PIN and driver name.
3. Search filtering with special requirements: filtering for `airportOnly` must correctly match rides flagged `airportFlightTransfer` OR routes stopping at `katunayake` (BIA airport hub).
4. File line limit guard: `YourRidesView.tsx` (currently ~564 lines) and `PublishRideView.tsx` (currently ~782 lines) must not breach 800 lines; extract modals into dedicated components in `src/components/`.
5. Driver journey transitions: `scheduled` → `departed` → `completed` must update `Ride.journeyStatus` without mutating `BookingRecord.status` invariants.

---

### Task 1: Domain Models, Plate Normalizer & Special Requirements Matching

**Files:**
- Create: `src/domain/carPlate.ts`
- Modify: `src/domain/matching.ts`
- Modify: `src/domain/sharing.ts`
- Test: `tests/yandex_taxi_domain.test.ts`

**Interfaces:**
- Consumes: `Ride`, `VehicleInfo`, `SearchQuery`.
- Produces: `formatSriLankanPlate(plateStr: string, isMasked?: boolean): { province: string; registration: string; isEv: boolean; full: string; masked: string }`, `SpecialRequirements`, extended `searchRides`, `buildEmergencySosText`, `buildForgottenItemRecoveryUrl`.

- [ ] **Step 1: Write failing unit test in `tests/yandex_taxi_domain.test.ts`**
```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import { formatSriLankanPlate } from '../src/domain/carPlate.ts';
import { searchRides, type Ride } from '../src/domain/matching.ts';
import { buildEmergencySosText, buildForgottenItemRecoveryUrl } from '../src/domain/sharing.ts';

test('formatSriLankanPlate formats, normalizes, and masks standard Sri Lankan vehicle plates', () => {
  const parsed = formatSriLankanPlate('WP CAB-1234');
  assert.equal(parsed.province, 'WP');
  assert.equal(parsed.registration, 'CAB-1234');
  assert.equal(parsed.full, 'WP CAB-1234');
  assert.equal(parsed.masked, 'WP CAB-••••');
  assert.equal(parsed.isEv, false);

  const evPlate = formatSriLankanPlate('SP EK-5678');
  assert.equal(evPlate.isEv, true);
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test`
Expected: FAIL ("cannot find module ../src/domain/carPlate.ts")

- [ ] **Step 3: Implement `src/domain/carPlate.ts`, update `src/domain/matching.ts` and `src/domain/sharing.ts`**
Implement plate parser, special requirements interface (`childSeatAvailable`, `wheelchairAccessible`, `airportFlightTransfer`), search query filtering, and message builders.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/domain/carPlate.ts src/domain/matching.ts src/domain/sharing.ts tests/yandex_taxi_domain.test.ts
git commit -m "feat: add car plate normalizer, special requirements matching, and sos builders"
```

---

### Task 2: Reactive Store State & Actions for Trusted Contacts & Saved Places

**Files:**
- Modify: `src/state/types.ts`
- Modify: `src/state/store.ts`
- Test: `tests/yandex_taxi_store.test.ts`

**Interfaces:**
- Consumes: `MarketplaceStore`, `UserProfile`.
- Produces: `TrustedContact`, `SavedPlace`, `addTrustedContact(contact)`, `removeTrustedContact(id)`, `saveFavoritePlace(place)`, `removeFavoritePlace(id)`.

- [ ] **Step 1: Write failing unit test in `tests/yandex_taxi_store.test.ts`**
```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createMarketplaceStore } from '../src/state/store.ts';

test('store manages trusted contacts and saved commute places', () => {
  const store = createMarketplaceStore();
  store.setUser({
    id: 'usr-test',
    name: 'Nuwan Perera',
    email: 'nuwan@test.lk',
    phone: '+94771234567',
    nicNumber: '199012345678',
    licenceNumber: 'B1234567',
    verifiedPhone: true,
    verifiedNic: true,
    verifiedLicence: true,
    hasProfilePhoto: true,
    bio: '',
    completedRidesLast12Months: 2,
    overallRating: 5.0,
    ratingsCount: 2,
    drivingSkillScore: 3.0,
    cancellationRatePercent: 0,
    avgResponseHours: 1,
    defaultVehicle: 'Toyota Aqua',
    comfort: { chattiness: 'bla', maxTwoInBack: true, luggage: 'medium', music: 'yes', pets: 'no', smoking: 'no', womenOnly: false },
    trustedContacts: [],
    savedPlaces: [],
  });

  store.addTrustedContact({ id: 'tc-1', name: 'Amma', phone: '+94712345678', relationship: 'Mother' });
  assert.equal(store.getState().currentUser?.trustedContacts?.length, 1);
  assert.equal(store.getState().currentUser?.trustedContacts?.[0].name, 'Amma');

  store.saveFavoritePlace({ id: 'sp-1', label: 'work', title: 'Work', hubId: 'makumbura', landmark: 'MMC Gate' });
  assert.equal(store.getState().currentUser?.savedPlaces?.length, 1);
  assert.equal(store.getState().currentUser?.savedPlaces?.[0].hubId, 'makumbura');
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test`
Expected: FAIL ("store.addTrustedContact is not a function")

- [ ] **Step 3: Implement store actions in `src/state/store.ts` and types in `src/state/types.ts`**
Add `trustedContacts` and `savedPlaces` to `UserProfile`, seed default contacts/places in `SEEDED_USERS`, and implement immutable store update actions.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/state/types.ts src/state/store.ts tests/yandex_taxi_store.test.ts
git commit -m "feat: add trusted contacts and saved places to marketplace store"
```

---

### Task 3: `CarPlateBadge` Component

**Files:**
- Create: `src/components/CarPlateBadge.tsx`
- Modify: `src/styles.css`
- Test: `tests/car_plate_badge.test.ts`

**Interfaces:**
- Consumes: `formatSriLankanPlate`.
- Produces: `<CarPlateBadge plate="WP CAB-1234" isMasked={false} size="sm" | "md" />`.

- [ ] **Step 1: Write failing unit test in `tests/car_plate_badge.test.ts`**
```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import { formatSriLankanPlate } from '../src/domain/carPlate.ts';

test('CarPlate handles unknown formats gracefully with national fallback', () => {
  const fallback = formatSriLankanPlate('Unknown');
  assert.equal(fallback.province, 'WP');
  assert.equal(fallback.registration, 'Unknown');
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test`
Expected: FAIL

- [ ] **Step 3: Implement `src/components/CarPlateBadge.tsx` and plate CSS styling in `src/styles.css`**
Render metallic white plate pill, dark embossed border, province column on the left with vertical hairline divider, monospace registration number, and optional EV green band styling.

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/components/CarPlateBadge.tsx src/styles.css tests/car_plate_badge.test.ts
git commit -m "feat: add authentic Sri Lankan CarPlateBadge component"
```

---

### Task 4: `SafetyCenterModal` Component

**Files:**
- Create: `src/components/SafetyCenterModal.tsx`

**Interfaces:**
- Consumes: `Ride`, `BookingRecord`, `UserProfile`, `buildEmergencySosText`, `shareTripDetails`.
- Produces: Modal with 1-tap dialers (`119`, `1990`, `1969`), 1-tap WhatsApp SOS dispatch to saved emergency contacts, and safe travel checklist.

- [ ] **Step 1: Create `src/components/SafetyCenterModal.tsx`**
Implement modal dialog with hardware back button dismissal support, clean header, 1-tap native call buttons (`tel:119`, `tel:1990`, `tel:1969`), trusted contacts list with WhatsApp links, and trip summary details.

- [ ] **Step 2: Verify TypeScript compilation**
Run: `npm run build`
Expected: PASS with no type errors.

- [ ] **Step 3: Commit**
```bash
git add src/components/SafetyCenterModal.tsx
git commit -m "feat: add SafetyCenterModal with 119/1990/1969 hotlines and SOS dispatch"
```

---

### Task 5: `ForgottenItemsModal` Component

**Files:**
- Create: `src/components/ForgottenItemsModal.tsx`

**Interfaces:**
- Consumes: `Ride`, `BookingRecord`, `buildForgottenItemRecoveryUrl`.
- Produces: Post-trip modal displaying driver card, phone call link, and 1-tap WhatsApp retrieval request generator with trip details and boarding PIN.

- [ ] **Step 1: Create `src/components/ForgottenItemsModal.tsx`**
Implement dialog with driver summary, `CarPlateBadge`, direct `tel:` call button, and `WhatsApp Driver about Left Item` anchor linking to `buildForgottenItemRecoveryUrl`.

- [ ] **Step 2: Verify TypeScript compilation**
Run: `npm run build`
Expected: PASS with no type errors.

- [ ] **Step 3: Commit**
```bash
git add src/components/ForgottenItemsModal.tsx
git commit -m "feat: add ForgottenItemsModal for post-trip left item recovery"
```

---

### Task 6: Profile View (`ProfileView.tsx`) Management for Saved Places & Trusted Contacts

**Files:**
- Modify: `src/views/ProfileView.tsx`

**Interfaces:**
- Consumes: `store.addTrustedContact`, `store.removeTrustedContact`, `store.saveFavoritePlace`, `store.removeFavoritePlace`.
- Produces: UI cards in Profile for managing Saved Commute Places and Emergency Trusted Contacts while staying strictly under 800 lines.

- [ ] **Step 1: Update `src/views/ProfileView.tsx`**
Add two clean cards below the verification section:
1. "Saved Commute Places (Home, Work, Campus)": Hub selector + landmark input + Add button; list of active saved places with 1-tap delete.
2. "Emergency Trusted Contacts (SOS)": Name + Phone (+94) + Relationship inputs + Add button (max 2 contacts); list of active contacts with delete.

- [ ] **Step 2: Verify line count and build**
Run: `npm run build`
Verify line count: `(Get-Content src/views/ProfileView.tsx).Length < 800`

- [ ] **Step 3: Commit**
```bash
git add src/views/ProfileView.tsx
git commit -m "feat: add saved places and trusted contacts management to ProfileView"
```

---

### Task 7: Commute Shortcuts in `HomeView.tsx` & Special Options in `PublishRideView.tsx`

**Files:**
- Modify: `src/views/HomeView.tsx`
- Modify: `src/views/PublishRideView.tsx`

**Interfaces:**
- Consumes: `SavedPlace`, `SpecialRequirements`.
- Produces: 1-tap shortcut chips on `HomeView.tsx` setting destination, and Step 4 special requirements checkboxes in `PublishRideView.tsx`.

- [ ] **Step 1: Update `src/views/HomeView.tsx`**
Render horizontal commute shortcut chips (🏠 Home, 🏢 Work, 🎓 Campus) above or below the search form. Tapping pre-fills `toHubId` (and sets `fromHubId` to nearest hub if matching).

- [ ] **Step 2: Update `src/views/PublishRideView.tsx`**
Add checkboxes in Step 4 for Special Options:
- 💺 Child Safety Seat available
- ♿ Wheelchair / Elderly Assistance friendly
- ✈️ Airport Flight Drop / BIA Terminal friendly
Pass `specialRequirements` to `store.publishRide`. Extract helper markup if needed to ensure file stays under 800 lines.

- [ ] **Step 3: Verify tests and line counts**
Run: `npm test && npm run build`
Verify line count: `(Get-Content src/views/PublishRideView.tsx).Length < 800`

- [ ] **Step 4: Commit**
```bash
git add src/views/HomeView.tsx src/views/PublishRideView.tsx
git commit -m "feat: add commute shortcuts to HomeView and special options to PublishRideView"
```

---

### Task 8: Search Filtering & Badges in `SearchView.tsx`, `SearchFilterControls.tsx`, `RideCardItem.tsx`

**Files:**
- Modify: `src/components/SearchFilterControls.tsx`
- Modify: `src/views/SearchView.tsx`
- Modify: `src/components/RideCardItem.tsx`

**Interfaces:**
- Consumes: `childSeatOnly`, `wheelchairOnly`, `airportOnly`, `CarPlateBadge`.
- Produces: Filter checkboxes and quick chips in search; masked plate badge and special requirement tags (`💺 Child Seat`, `♿ Accessible`, `✈️ Airport Transit`) on cards.

- [ ] **Step 1: Update `src/components/SearchFilterControls.tsx` & `src/views/SearchView.tsx`**
Add filter checkboxes in sidebar/drawer for `Child Seat`, `Wheelchair Accessible`, and `Airport Transit`. Add quick filter chips in mobile strip.

- [ ] **Step 2: Update `src/components/RideCardItem.tsx`**
Embed `<CarPlateBadge plate={ride.vehicle.plateHint || ride.vehicle.plateNumber || 'WP CAB-••••'} isMasked size="sm" />`.
Render special requirements badges if active on ride.

- [ ] **Step 3: Run tests and build**
Run: `npm test && npm run build`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add src/components/SearchFilterControls.tsx src/views/SearchView.tsx src/components/RideCardItem.tsx
git commit -m "feat: add special requirement filters and masked plate badges to search"
```

---

### Task 9: Ride Detail, Ride Pass & Your Rides View Integrations

**Files:**
- Modify: `src/views/RideDetailView.tsx`
- Modify: `src/components/RidePassModal.tsx`
- Modify: `src/views/YourRidesView.tsx`

**Interfaces:**
- Consumes: `CarPlateBadge`, `SafetyCenterModal`, `ForgottenItemsModal`, quick chat chips.
- Produces:
  - `RideDetailView.tsx`: Displays `CarPlateBadge` and special requirement tags.
  - `RidePassModal.tsx`: Unmasked `CarPlateBadge`, "🛡️ Safety Center" button opening `SafetyCenterModal`.
  - `YourRidesView.tsx`: Driver "Start Journey" / "Complete Journey" buttons, "🟢 Driver En Route" passenger indicator, "🎒 Left something in car?" opening `ForgottenItemsModal`, and 1-tap chat coordination chips.

- [ ] **Step 1: Update `src/views/RideDetailView.tsx` and `src/components/RidePassModal.tsx`**
Integrate `CarPlateBadge` (full unmasked plate on RidePassModal) and wire `SafetyCenterModal`.

- [ ] **Step 2: Update `src/views/YourRidesView.tsx`**
Add Driver journey transition actions:
- If `journeyStatus === 'scheduled'`: "🚀 Start Journey" button.
- If `journeyStatus === 'departed'`: "🏁 Complete Journey" button.
Add Passenger completed action:
- "🎒 Left something in car?" button opening `ForgottenItemsModal`.
In Chat Drawer:
- Add quick coordination chips (`"I'm at the pickup point"`, `"Running 5 mins late"`, `"Arrived in White Aqua"`, `"Boarded, thanks!"`).
Ensure `YourRidesView.tsx` stays strictly under 800 lines.

- [ ] **Step 3: Run full verification suite**
Run: `npm test && npm run build`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**
```bash
git add src/views/RideDetailView.tsx src/components/RidePassModal.tsx src/views/YourRidesView.tsx
git commit -m "feat: wire journey lifecycle, chat chips, safety center, and forgotten items into views"
```

---

### Task 10: Complete Verification & End-to-End Sanity Check

**Files:**
- Verify: all modified files

- [ ] **Step 1: Run complete automated test suite**
Run: `npm test`
Expected: 100% passing tests (existing 74 tests + new domain/store tests).

- [ ] **Step 2: Run production TypeScript & Vite build**
Run: `npm run build`
Expected: Build succeeds with 0 errors and 0 warnings.

- [ ] **Step 3: Check all file line counts**
Verify every file in `src/` is strictly under 800 lines:
```powershell
Get-ChildItem -Path src -Recurse -File -Include *.ts,*.tsx | Where-Object { (Get-Content $_.FullName).Length -gt 800 }
```
Expected: 0 files returned.

- [ ] **Step 4: Commit and finalize**
```bash
git commit --allow-empty -m "chore: complete yandex go taxi features verification"
```
