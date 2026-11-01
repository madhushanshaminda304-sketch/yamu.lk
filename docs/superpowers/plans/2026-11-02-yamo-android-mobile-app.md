# Yamo Sri Lanka Android Mobile App (`com.yamo.lk`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the native Android mobile application for Yamo Sri Lanka carpooling (`com.yamo.lk`), mirroring BlaBlaCar Android (`com.comuto`) UX with a 5-tab bottom navigation shell, dedicated `/inbox`, nearest-hub GPS auto-detection, native haptics/status bar/back button handling, and a complete Gradle Android Studio project via Capacitor 7.

**Architecture:** Capacitor 7 wraps the verified React 19 + TypeScript + Vite codebase in `blablacar-lk`, sharing 100% of Sri Lankan corridor routing, LKR pricing, trust verification, and Supabase sync. A native services layer abstracts hardware back buttons, GPS location matching, and haptics with graceful browser fallbacks. The UI layer adapts to mobile viewports with a 5-tab fixed bottom bar, compact top app bar, and dedicated `/inbox` screen.

**Tech Stack:** React 19, TypeScript 5.7, Vite 6, `@capacitor/core` 7.x, `@capacitor/cli` 7.x, `@capacitor/android` 7.x, `@capacitor/app`, `@capacitor/status-bar`, `@capacitor/haptics`, `@capacitor/geolocation`, `@capacitor/keyboard`, `@phosphor-icons/react`, Sonner.

**Spec:** [`docs/superpowers/specs/2026-11-02-yamo-android-mobile-app-design.md`](file:///c:/Users/DELL/Downloads/blabla%20new/blablacar-lk/docs/superpowers/specs/2026-11-02-yamo-android-mobile-app-design.md)

## Global Constraints
- Target package ID: `com.yamo.lk` verbatim.
- Application Name: `Yamo - Carpooling Sri Lanka` (short: `Yamo`).
- Target Android SDK: Android 15 / API 35 with minimum SDK API 24 (Android 7.0+).
- Brand colors: `#00875A` (Yamo Emerald Light), `#0F172A` (Dark Background), `#FF6B4A` (Coral Accent).
- Web build (`npm run build`) and test suite (`npm test`) must pass cleanly at every task boundary.
- Zero external runtime breakages when running in ordinary desktop web browsers.

## Review Focus
- **Location permissions denied/unavailable**: Gracefully catches browser/device permission denial and displays a helpful Sonner toast instead of crashing.
- **Hardware back button at app root**: Prevents abrupt app exit by requiring double-tap or confirmation when no modal/subview is active.
- **Screen notch / gesture navigation overlap**: Bottom navigation bar and action sheets must respect `env(safe-area-inset-bottom)`.
- **Keyboard viewport obstruction on Android**: Mobile search and chat inputs must not be hidden behind the virtual soft keyboard.
- **Empty Inbox state**: Displays a friendly carpooling illustration and explanation when no ride conversations exist yet.

---

### Task 1: Native Mobile Services Layer & Geolocation Nearest-Hub Matcher

**Files:**
- Create: `src/native/platform.ts`
- Create: `src/native/geolocation.ts`
- Create: `src/native/haptics.ts`
- Create: `src/native/backButton.ts`
- Create: `src/native/statusBar.ts`
- Test: `tests/native-geolocation.test.ts`

**Interfaces:**
- Consumes: `Hub` from `src/domain/corridors.ts`
- Produces: 
  - `isNativePlatform(): boolean`
  - `findNearestHub(coords: { latitude: number; longitude: number }, hubs: Hub[]): { hub: Hub; distanceKm: number }`
  - `triggerHaptic(type: 'selection' | 'success' | 'warning' | 'error'): Promise<void>`
  - `registerBackButtonHandler(navigate: (path: string | -1) => void, isModalOpen: () => boolean, closeModal: () => void): () => void`

- [ ] **Step 1: Write the failing test for nearest hub matching**

```typescript
// tests/native-geolocation.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { findNearestHub } from '../src/native/geolocation.ts';
import { ALL_HUBS } from '../src/domain/corridors.ts';

describe('Nearest Sri Lankan Hub Geolocation Matcher', () => {
  it('identifies Makumbura Multimodal Center when GPS is near Kottawa/Maharagama', () => {
    // 6.8400° N, 79.9700° E (Near Kottawa)
    const result = findNearestHub({ latitude: 6.8400, longitude: 79.9700 }, ALL_HUBS);
    assert.equal(result.hub.id, 'makumbura');
    assert.ok(result.distanceKm < 5, `Expected distance < 5km, got ${result.distanceKm}`);
  });

  it('identifies Kandy Clock Tower when GPS is near Peradeniya/Kandy', () => {
    // 7.2910° N, 80.6330° E
    const result = findNearestHub({ latitude: 7.2910, longitude: 80.6330 }, ALL_HUBS);
    assert.equal(result.hub.id, 'kandy');
    assert.ok(result.distanceKm < 3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types tests/native-geolocation.test.ts`
Expected: FAIL with "Cannot find module '../src/native/geolocation.ts'"

- [ ] **Step 3: Implement `src/native/*` services layer**

Implement `findNearestHub` using Haversine spherical distance formula against all hubs.
Implement `platform.ts`, `haptics.ts`, `backButton.ts`, and `statusBar.ts` with safe browser fallbacks when Capacitor plugins are not present or web runtime is active.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types tests/native-geolocation.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/native/ tests/native-geolocation.test.ts
git commit -m "feat(mobile): add native services layer and nearest hub geolocation matcher"
```

---

### Task 2: Mobile 5-Tab Navigation Shell, Mobile Top Bar & Responsive Shell

**Files:**
- Create: `src/components/MobileBottomNav.tsx`
- Create: `src/components/MobileTopBar.tsx`
- Modify: `src/App.tsx:60-150`
- Modify: `src/styles.css`
- Test: `tests/mobile-navigation.test.ts`

**Interfaces:**
- Consumes: `useMarketplaceStore` from `src/state/store.ts`, `useLocation`, `useNavigate` from `react-router-dom`
- Produces: `<MobileBottomNav />`, `<MobileTopBar />`

- [ ] **Step 1: Write the failing test for mobile navigation badge counters**

```typescript
// tests/mobile-navigation.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeMobileBadges } from '../src/components/MobileBottomNav.tsx';

describe('Mobile Bottom Navigation Badges', () => {
  it('calculates pending booking requests for driver rides', () => {
    const rides = [
      { id: 'r1', driver: { name: 'Saman' }, bookings: [{ status: 'pending' }, { status: 'confirmed' }] },
      { id: 'r2', driver: { name: 'Other' }, bookings: [{ status: 'pending' }] }
    ];
    const badges = computeMobileBadges(rides as any, 'Saman', 2);
    assert.equal(badges.yourRidesPendingCount, 1);
    assert.equal(badges.inboxUnreadCount, 2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types tests/mobile-navigation.test.ts`
Expected: FAIL with "Cannot find module '../src/components/MobileBottomNav.tsx'"

- [ ] **Step 3: Implement `MobileBottomNav`, `MobileTopBar`, and update `App.tsx`**

- Build `<MobileBottomNav />` with 5 tabs (`Search`, `Publish`, `Your Rides`, `Inbox`, `Profile`), icons, active styling, and safe area padding `pb-[calc(0.5rem+env(safe-area-inset-bottom))]`.
- Build `<MobileTopBar />` with compact Yamo branding, title, and trilingual language switcher.
- Update `App.tsx` to mount `<MobileTopBar />` and `<MobileBottomNav />` on mobile screens (`md:hidden` or native platform).
- Hide wide desktop footer `.site-footer` on mobile viewports.
- Update `<Toaster />` in `App.tsx` with `mobileOffset={{ bottom: 76 }}` so toasts appear cleanly above the bottom navigation bar.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types tests/mobile-navigation.test.ts`
Expected: PASS

- [ ] **Step 5: Verify web build and existing tests**

Run: `npm test && npm run build`
Expected: All tests pass and Vite builds `dist/` cleanly.

- [ ] **Step 6: Commit**

```bash
git add src/components/MobileBottomNav.tsx src/components/MobileTopBar.tsx src/App.tsx src/styles.css tests/mobile-navigation.test.ts
git commit -m "feat(mobile): add 5-tab bottom navigation shell and responsive mobile app bar"
```

---

### Task 3: Dedicated Inbox View & Active Conversation Threads

**Files:**
- Create: `src/views/InboxView.tsx`
- Modify: `src/state/types.ts`
- Modify: `src/state/store.ts`
- Modify: `src/App.tsx`
- Test: `tests/inbox-threads.test.ts`

**Interfaces:**
- Consumes: `MarketplaceState.messages`, `MarketplaceState.rides` from `src/state/store.ts`
- Produces: 
  - `getInboxThreads(state: MarketplaceState, currentUserId: string): ConversationThread[]`
  - `<InboxView />` route at `/inbox`

- [ ] **Step 1: Write the failing test for inbox thread aggregation**

```typescript
// tests/inbox-threads.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { aggregateInboxThreads } from '../src/views/InboxView.tsx';

describe('Inbox Thread Aggregation', () => {
  it('groups messages by booking and sorts by latest sent time', () => {
    const messages = [
      { id: 'm1', bookingId: 'b1', body: 'Are you at Makumbura?', sentAt: '2026-11-02T08:00:00Z', senderRole: 'passenger' },
      { id: 'm2', bookingId: 'b2', body: 'Leaving Kandy now', sentAt: '2026-11-02T09:00:00Z', senderRole: 'driver' }
    ];
    const rides = [
      { id: 'r1', originHubId: 'makumbura', destinationHubId: 'galle', bookings: [{ id: 'b1', passengerName: 'Kamal' }] },
      { id: 'r2', originHubId: 'kandy', destinationHubId: 'colombo', bookings: [{ id: 'b2', passengerName: 'Nimal' }] }
    ];
    const threads = aggregateInboxThreads(messages as any, rides as any);
    assert.equal(threads.length, 2);
    assert.equal(threads[0].bookingId, 'b2', 'Most recent message should be first');
    assert.equal(threads[0].lastMessage, 'Leaving Kandy now');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types tests/inbox-threads.test.ts`
Expected: FAIL with "Cannot find module '../src/views/InboxView.tsx'"

- [ ] **Step 3: Implement `InboxView.tsx` and register route in `App.tsx`**

- Create `src/views/InboxView.tsx` with:
  - Header: "Inbox / පණිවිඩ / செய்திகள்" with unread indicator.
  - Thread list: Ride corridor badge (e.g. "Makumbura → Galle"), other party name, last message preview, time ago.
  - Tapping a thread opens the interactive `AntiScamChatModal` for that booking.
  - Empty state with carpooling messaging illustration.
- Add route `<Route path="/inbox" element={<InboxView />} />` in `App.tsx`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types tests/inbox-threads.test.ts`
Expected: PASS

- [ ] **Step 5: Verify build & tests**

Run: `npm test && npm run build`
Expected: All tests pass, build passes.

- [ ] **Step 6: Commit**

```bash
git add src/views/InboxView.tsx src/state/ src/App.tsx tests/inbox-threads.test.ts
git commit -m "feat(mobile): add dedicated Inbox view with ride conversation threads"
```

---

### Task 4: "Use My Location" 1-Tap Geolocation on Search & Publish

**Files:**
- Modify: `src/views/HomeView.tsx`
- Modify: `src/views/SearchView.tsx`
- Modify: `src/views/PublishRideView.tsx`
- Modify: `src/domain/i18n.ts`

**Interfaces:**
- Consumes: `findNearestHub` from `src/native/geolocation.ts`, `ALL_HUBS` from `src/domain/corridors.ts`
- Produces: 1-tap "📍 Use my location" button on origin input fields

- [ ] **Step 1: Add localization strings for geolocation**

In `src/domain/i18n.ts`:
- `use_my_location`: `en`: "Use my location", `si`: "මගේ ස්ථානය ගන්න", `ta`: "எனது இருப்பிடம்"
- `locating`: `en`: "Locating nearest hub...", `si`: "ළඟම මධ්‍යස්ථානය සොයමින්...", `ta`: "அருகிலுள்ள நிலையத்தைத் தேடுகிறது..."
- `hub_located`: `en`: "Nearest hub located: ", `si`: "ළඟම මධ්‍යස්ථානය: ", `ta`: "அருகிலுள்ள நிலையம்: "

- [ ] **Step 2: Implement "Use my location" button in `HomeView`, `SearchView`, and `PublishRideView`**

Wire the button to call browser/Capacitor GPS, calculate the nearest hub via `findNearestHub`, automatically set the Origin Hub state, trigger a subtle haptic pulse, and notify via `toast.success`. Handle permission denial gracefully with `toast.error`.

- [ ] **Step 3: Verify build and test suite**

Run: `npm test && npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/views/HomeView.tsx src/views/SearchView.tsx src/views/PublishRideView.tsx src/domain/i18n.ts
git commit -m "feat(mobile): integrate 1-tap GPS nearest hub detection on search and publish"
```

---

### Task 5: Capacitor 7 Android Project Scaffolding & Asset Generation

**Files:**
- Create: `capacitor.config.ts`
- Create: `scripts/generate-android-icons.js`
- Create: `android/` (via `npx cap add android`)
- Modify: `package.json`

**Interfaces:**
- Consumes: `dist/` web assets, Capacitor CLI
- Produces: Complete Android Studio Gradle project in `android/` with package `com.yamo.lk`

- [ ] **Step 1: Install Capacitor dependencies in `blablacar-lk`**

```bash
npm install @capacitor/core@^7.0.0 @capacitor/app@^7.0.0 @capacitor/status-bar@^7.0.0 @capacitor/haptics@^7.0.0 @capacitor/geolocation@^7.0.0 @capacitor/keyboard@^7.0.0
npm install --save-dev @capacitor/cli@^7.0.0 @capacitor/android@^7.0.0
```

- [ ] **Step 2: Create `capacitor.config.ts`**

Configure `appId: 'com.yamo.lk'`, `appName: 'Yamo'`, `webDir: 'dist'`.

- [ ] **Step 3: Generate the native Android project**

Run:
```bash
npm run build
npx cap add android
```
Expected: `android/` folder initialized with Gradle project and `com.yamo.lk` package structure.

- [ ] **Step 4: Configure `AndroidManifest.xml` and generate app launcher icons**

- Add location and internet permissions to `android/app/src/main/AndroidManifest.xml`.
- Set app title in `strings.xml`.
- Generate Yamo brand adaptive icons for `android/app/src/main/res/mipmap-*` (`ic_launcher.png`, `ic_launcher_round.png`).

- [ ] **Step 5: Add Capacitor sync and build scripts to `package.json`**

Add scripts:
`"cap:sync": "npm run build && npx cap sync android"`,
`"cap:build": "npm run build && npx cap copy android"`.

- [ ] **Step 6: Run full verification cycle**

Run:
```bash
npm test
npm run build
npm run cap:sync
```
Expected: All tests pass, build passes, and `npx cap sync android` successfully syncs web assets into the Android native project.

- [ ] **Step 7: Commit**

```bash
git add capacitor.config.ts package.json package-lock.json android/ scripts/
git commit -m "feat(mobile): scaffold Capacitor 7 Android project with com.yamo.lk and adaptive icons"
```
