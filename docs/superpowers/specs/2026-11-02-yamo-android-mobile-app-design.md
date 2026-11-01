# Yamo Sri Lanka Android Mobile App (`com.yamo.lk`) — Architecture & Native Implementation Design

## 1. Intent & Why
To extend the **Yamo Sri Lanka** (`yamo.lk`) intercity carpooling platform from its current web application into a fully native Android mobile application. The mobile app mirrors the ergonomics, navigation hierarchy, and user flows of the official BlaBlaCar Android application ([`com.comuto`](https://play.google.com/store/apps/details?id=com.comuto&pcampaignid=web_share)), while anchoring to Sri Lankan highway corridors, LKR distance cost-sharing, NIC verification, and trilingual (`en-LK`, `si-LK`, `ta-LK`) commuter expectations.

By leveraging **Capacitor 7**, the project reuses 100% of Yamo's verified domain engine (Corridor capacity tracking, LKR pricing engine, Boost stopover matching, scam detection, Supabase sync) and React 19 UI components, while delivering a native Android Gradle project in `android/` equipped with hardware back button routing, haptics, status bar styling, safe-area inset management, and GPS nearest-hub auto-detection.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
1. **Native Android Project Scaffolding**:
   - Configure Capacitor 7 (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`).
   - App identifier: `com.yamo.lk`.
   - App Name: `Yamo - Carpooling Sri Lanka`.
   - Complete Android Studio / Gradle project generated in `blablacar-lk/android/` with Android 15 / API 35 target SDK and Java 21 / Gradle 8.x compatibility.
2. **5-Tab BlaBlaCar Mobile Navigation (`com.comuto` UX)**:
   - Dedicated mobile bottom navigation bar persisting across root views:
     - 🔍 **Search**: Corridor origin/destination autocomplete, date selector, seat counter, and filtered ride list with smart tags (`Cheapest`, `Earliest`, `Fastest`, `Boost`).
     - ➕ **Publish**: 6-step conversational wizard (Meeting point selection, Expressway vs A-Road route choice, Departure & optional return date/time, Seat count with *"Max. 2 in the back"*, Recommended LKR price stepper, Instant vs Manual approval).
     - 🚗 **Your Rides**: Driver ride management (stopover itinerary, booking requests, passenger manifest) and Passenger Ride Passes with QR code verification.
     - 💬 **Inbox**: Dedicated `/inbox` view displaying all active ride coordination chat threads, unread badge counters, and real-time messaging with anti-scam safeguards and direct WhatsApp/call handoff.
     - 👤 **Profile**: Member trust hub (Sri Lankan NIC + phone OTP verification status, vehicle details, comfort preferences, double-blind reviews, and language switcher).
   - Dynamic badge counters on `Your Rides` (pending booking requests) and `Inbox` (unread messages).
3. **Mobile Shell & Viewport Adaptation**:
   - Responsive mobile app bar with compact Yamo branding, title, and quick language switch pill (`EN | සිං | தமிழ்`).
   - Desktop marketing footer hidden on mobile to give unobstructed room to the bottom navigation bar and content.
   - Full safe-area inset support (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`) ensuring navigation bars and action sheets do not clip beneath Android gesture navigation or display cutouts.
4. **Native Mobile Plugins & Integrations**:
   - `@capacitor/app`: Hardware back-button handling on Android (steps back in conversational publish wizard, dismisses active modals/sheets, navigates back in browser history, or exits app gracefully at the root).
   - `@capacitor/status-bar`: Configures translucent/themed status bar matching Yamo's header styling (`#00875A` brand green in light mode, `#0F172A` in dark mode).
   - `@capacitor/haptics`: Tactile feedback on key actions (stepping LKR price `±50`, tapping filter chips, booking confirmation, ride publication).
   - `@capacitor/geolocation`: "Use my location" 1-tap detector on Search and Publish views that computes the nearest of the 28 Sri Lankan Hubs (e.g. Makumbura Multimodal Center, Kadawatha, Kottawa, Kandy Clock Tower) using Haversine distance.
   - `@capacitor/keyboard`: Viewport resize and accessory bar handling during search typing and in-app chat.
   - In-app badge counting and local notification triggers for booking confirmations and new chat messages.
5. **App Icons & Splash Screen Assets**:
   - Complete set of Android adaptive launcher icons (`mipmap-mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`) featuring the Yamo carpooling logomark on brand emerald background.
   - Clean native splash screen transitioning seamlessly into the React interactive view.
6. **Dual-Target Build Pipeline**:
   - `npm run build` continues to build the Cloudflare / Vercel web distribution in `dist/`.
   - `npm run cap:sync` / `npm run cap:build` builds web assets and syncs them to `android/` ready for Gradle compilation.

### Non-Goals
- Rebuilding the UI in React Native or Flutter (would duplicate 2000+ lines of tested Sri Lankan carpooling domain code, i18n, and Supabase sync).
- Commercial taxi meter dispatch or live driver GPS turn-by-turn map tracking (Yamo is non-commercial cost-sharing carpooling).
- In-app card processing or escrow payment walls (settlement is onboard cash or LankaQR at the trip).
- Cloud Firebase FCM setup during local build (local notification hooks provided; cloud FCM requires user's external credentials).

### Anti-Goals
- Never break the web application or existing automated test suite (`tests/*.test.ts`).
- Never allow hardware back button on Android to terminate the app while a wizard step or modal is open.
- Never hardcode API keys or credentials in client bundles.

---

## 3. Approaches Considered

| Approach | Description | Pros | Cons | Decision |
|---|---|---|---|---|
| **Approach A (Selected): Capacitor 7 Native Android Application in `blablacar-lk`** | Wrap the existing React 19 + TypeScript + Vite project with Capacitor 7, generating a native Android project with Gradle. | • 100% code reuse of domain logic, state store, and Supabase sync.<br>• Instant feature parity with web app.<br>• Native hardware back button, haptics, geolocation, and status bar.<br>• Generates standard Gradle project opened in Android Studio. | • Requires Capacitor plugin dependencies in `package.json`. | **Selected** — Best balance of rapid delivery, zero logic duplication, and native mobile UX. |
| **Approach B: Separate React Native / Expo Application** | Create a standalone React Native app under `mobile/` using Expo SDK 52. | • True native views (`ViewGroup`, `TextView`). | • Complete rewrite of all UI views.<br>• Incompatible with DOM-based libraries (like React DOM, CSS animations).<br>• High maintenance burden maintaining two separate UIs. | **Rejected** |
| **Approach C: Progressive Web App (PWA) Only** | Add PWA manifest and service worker without native Android container. | • Zero native build dependencies. | • Cannot be distributed as an `.apk` on Google Play.<br>• No native hardware back button hook.<br>• Clunky status bar and keyboard behavior on Android. | **Rejected** |

---

## 4. Architecture & Module Design

### 4.1 Capacitor Configuration (`capacitor.config.ts`)
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yamo.lk',
  appName: 'Yamo',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#00875A'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  }
};

export default config;
```

### 4.2 Native Services Layer (`src/native/`)
- `src/native/platform.ts`: Detects native Capacitor environment vs web browser (`Capacitor.isNativePlatform()`).
- `src/native/backButton.ts`: Registers Android hardware back button handler. Manages modal dismissals, history pop, and double-tap-to-exit protection at app root.
- `src/native/haptics.ts`: Safe wrapper around `@capacitor/haptics` with graceful web fallback (using `navigator.vibrate` or no-op).
- `src/native/geolocation.ts`: Uses `@capacitor/geolocation` to obtain current GPS coordinates, then matches the closest Sri Lankan Hub in `src/domain/corridors.ts` via Haversine distance formula.
- `src/native/statusBar.ts`: Dynamic status bar color switcher for modal views and theme transitions.

### 4.3 Mobile Navigation Shell (`src/components/MobileBottomNav.tsx`)
- Fixed bottom navigation bar visible on mobile screen widths (< 768px or native platform).
- 5 tabs matching BlaBlaCar `com.comuto`:
  1. `Search` (`/` or `/search`)
  2. `Publish` (`/publish`)
  3. `Your Rides` (`/your-rides`) — with badge indicator for pending driver requests
  4. `Inbox` (`/inbox`) — with badge indicator for unread messages
  5. `Profile` (`/profile`)
- Proper safe-area padding: `pb-[calc(0.5rem+env(safe-area-inset-bottom))]`.

### 4.4 Dedicated Inbox Screen (`src/views/InboxView.tsx`)
- Displays conversation threads between passenger and driver for all active and confirmed rides.
- Shows ride summary snippet (e.g., "Colombo -> Kandy, 14 Nov"), last message preview, unread indicator, and relative timestamp.
- Tapping a thread opens the full Anti-Scam chat drawer with quick WhatsApp and phone call actions.
- Synchronized via Supabase `messages` table and local state persistence.

### 4.5 Geolocation Nearest Hub Integration
- Added to `HomeView.tsx`, `SearchView.tsx`, and `PublishRideView.tsx`:
- A "📍 Use my location" button next to Origin Hub input.
- Computes:
  $$\text{dist}(lat_1, lon_1, lat_2, lon_2) = 2r \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta lat}{2}\right) + \cos(lat_1)\cos(lat_2)\sin^2\left(\frac{\Delta lon}{2}\right)} \right)$$
- Instantly selects the closest hub (e.g. if GPS is near Kottawa/Maharagama, selects *Makumbura Multimodal Center*).

### 4.6 Android Project Scaffolding (`android/`)
- Generated via `npx cap add android`.
- `AndroidManifest.xml` permissions:
  - `android.permission.INTERNET`
  - `android.permission.ACCESS_FINE_LOCATION`
  - `android.permission.ACCESS_COARSE_LOCATION`
- `strings.xml`: App title "Yamo - Carpooling Sri Lanka".
- App Icons: `mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}` adaptive launcher icons.

---

## 5. Builder Calls & Resolved Decisions
1. **Inbox View**: Built as a dedicated `/inbox` route with thread previews, hooked into the existing `messages` table in `supabase/schema.sql`.
2. **App Shell**: Desktop header and marketing footer hidden on mobile viewport/native container; replaced with a lightweight mobile top bar and language switcher.
3. **Search Tab**: Active for both `/` and `/search`, taking the user straight to corridor discovery.
4. **Notifications**: Foreground badge computation and local notifications implemented directly; Firebase Cloud Messaging (FCM) cloud config stubbed for production deployment.
