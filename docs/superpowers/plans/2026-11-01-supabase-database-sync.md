# Supabase Cloud Database Real-time Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect Yamu to Supabase PostgreSQL so that published rides, seat reservations, and user profiles persist centrally across multiple devices in real-time, with zero-crash offline resilience.

**Architecture:** Use `@supabase/supabase-js` configured via `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Abstract database operations into a focused `src/state/supabaseSync.ts` adapter layer keeping `store.ts` clean and below the 800-line ceiling. The store syncs remote rides on initialization and persists published rides and bookings asynchronously, falling back to local memory if offline.

**Tech Stack:** React 19, TypeScript 5.7, `@supabase/supabase-js`, Supabase PostgreSQL.

**Spec:** [docs/superpowers/specs/2026-11-01-supabase-database-sync-design.md](file:///c:/Users/DELL/Downloads/blabla%20new/blablacar-lk/docs/superpowers/specs/2026-11-01-supabase-database-sync-design.md)

---

## Global Constraints

- **File line ceiling**: Strictly maintain all modified files under 800 lines (ECC rule).
- **Graceful Fallback**: Network failures or missing credentials must never throw unhandled promise rejections or crash the client.
- **Parity with Domain Types**: Keep `Ride`, `BookingRecord`, and `UserProfile` domain types intact.
- **All 34 existing automated tests must continue passing**.

---

## Review Focus

1. **Snake_case vs CamelCase mapping**: PostgreSQL tables use `departure_date`, `full_price_lkr`, while TypeScript uses `departureDate`, `fullPriceLkr`. Ensure the adapter cleanly bidirectional-maps properties without silent field dropping.
2. **Offline / Network Interruption**: If the user loses 4G connectivity while browsing, reading or writing must fall back to local store state without modal freezes.
3. **Empty Database Seeding**: On initial load against a fresh Supabase database with 0 rows, auto-seed standard corridor rides so new visitors don't face a blank search screen.
4. **Environment Variables**: Respect Vite's `import.meta.env.VITE_SUPABASE_URL` with fallback to the configured project endpoint.
5. **JSONB Stopover Storage**: Ensure stops array with pickup landmarks and intermediate timings serialize and deserialize correctly.

---

### Task 1: Install `@supabase/supabase-js` and Create Client Layer

**Files:**
- Modify: `package.json`
- Create: `.env`
- Create: `.env.example`
- Create: `src/lib/supabase.ts`
- Create: `tests/supabase.test.ts`

- [ ] **Step 1: Install `@supabase/supabase-js`**
  Run: `npm install @supabase/supabase-js`

- [ ] **Step 2: Create `.env` and `.env.example`**
  Configure:
  ```env
  VITE_SUPABASE_URL=https://ykjmjwlvucbzmgfdyjfd.supabase.co
  VITE_SUPABASE_ANON_KEY=sb_publishable_0ivNm3eqJ6wOdOE9fQZn9g_dXzPidB0
  ```

- [ ] **Step 3: Create `src/lib/supabase.ts`**
  Initialize `supabase` client with fallback guards and helper `isSupabaseConfigured()`.

- [ ] **Step 4: Author `tests/supabase.test.ts`**
  Write unit tests verifying Supabase client initialization, configuration checks, and safe fallback.

- [ ] **Step 5: Run tests and verify**
  Run: `node --test --experimental-strip-types tests/supabase.test.ts`
  Expected: PASS.

- [ ] **Step 6: Commit**
  ```bash
  git add package.json package-lock.json .env.example src/lib/supabase.ts tests/supabase.test.ts
  git commit -m "feat(supabase): install supabase-js and configure client layer"
  ```

---

### Task 2: Supabase Data Adapter (`src/state/supabaseSync.ts`)

**Files:**
- Create: `src/state/supabaseSync.ts`
- Test: `tests/supabaseSync.test.ts`

**Interfaces:**
- Consumes: `Ride`, `BookingRecord`, `UserProfile` domain models.
- Produces:
  - `fetchRemoteRides(): Promise<Ride[]>`
  - `persistRemoteRide(ride: Ride): Promise<boolean>`
  - `persistRemoteBooking(booking: BookingRecord): Promise<boolean>`
  - `seedRemoteRidesIfEmpty(seededRides: Ride[]): Promise<void>`

- [ ] **Step 1: Write unit test in `tests/supabaseSync.test.ts`**
  Test conversion between domain `Ride` objects and Supabase row structures (camelCase <-> snake_case).

- [ ] **Step 2: Run test to verify it fails**
  Run: `node --test --experimental-strip-types tests/supabaseSync.test.ts`
  Expected: FAIL on missing module.

- [ ] **Step 3: Implement `src/state/supabaseSync.ts`**
  Implement conversion mappers, fetch logic, insert logic, and empty database auto-seeding.

- [ ] **Step 4: Run test to verify it passes**
  Run: `node --test --experimental-strip-types tests/supabaseSync.test.ts`
  Expected: PASS.

- [ ] **Step 5: Commit**
  ```bash
  git add src/state/supabaseSync.ts tests/supabaseSync.test.ts
  git commit -m "feat(supabase): add remote sync adapter for rides and bookings"
  ```

---

### Task 3: Store Integration & Live Synchronization

**Files:**
- Modify: `src/state/store.ts`
- Modify: `src/main.tsx` (or `App.tsx`)

- [ ] **Step 1: Wire store actions to trigger asynchronous remote sync**
  - In `publishRide`: call `persistRemoteRide(newRide)` in background.
  - In `bookRideLeg`: call `persistRemoteBooking(booking)` in background.
  - Export `initRemoteSync(store)` to load remote rides and merge into store on startup.

- [ ] **Step 2: Call `initRemoteSync(store)` on app mount**
  In `src/App.tsx`, trigger `initRemoteSync(store)` inside a `useEffect` so visiting users immediately pull live rides from Supabase.

- [ ] **Step 3: Run full automated test suite**
  Run: `npm test`
  Expected: All 35+ tests pass with 0 failures.

- [ ] **Step 4: Verify production build**
  Run: `npm run build`
  Expected: Clean build in `dist/`.

- [ ] **Step 5: Commit**
  ```bash
  git add src/state/store.ts src/App.tsx
  git commit -m "feat(supabase): wire store to live Supabase database sync"
  ```

---

### Task 4: Verification, Git Push & Cloudflare Deployment

- [ ] **Step 1: Verify live insertion in Supabase table**
  Confirm remote table receives published ride.
- [ ] **Step 2: Check line counts**
  Verify all files remain strictly under 800 lines.
- [ ] **Step 3: Push changes to GitHub repository**
  `git push origin main`
