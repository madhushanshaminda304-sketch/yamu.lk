# Passwordless Sri Lankan Phone OTP Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement passwordless Sri Lankan phone number OTP authentication, account registration, session persistence, and contextual auth gating for BlaBlaCar Sri Lanka (`blablacar-lk`).

**Architecture:** A lightweight domain auth engine (`src/domain/auth.ts`) handles Sri Lankan phone number normalization and OTP lifecycle (generation, expiration, attempts, and verification). The reactive store (`src/state/store.ts`) manages `currentUser`, `registeredUsers`, and `activeOtpChallenge` with `localStorage` persistence. An interactive multi-step modal (`src/components/AuthModal.tsx`) with Sonner toasts provides phone entry, OTP input with countdown/auto-fill, and new-user onboarding, gating publish/booking actions while allowing open browsing.

**Tech Stack:** TypeScript, React 19, Vite, Sonner, @phosphor-icons/react, Node.js test runner (`node:test`, `node:assert`).

**Spec:** `docs/superpowers/specs/2026-11-01-phone-otp-auth-design.md`

## Global Constraints

- Sri Lankan phone normalization strictly accepts standard mobile patterns (`07XXXXXXXX`, `+947XXXXXXXX`, `7XXXXXXXX`) and formats them to international E.164 (`+947XXXXXXXX`).
- OTP codes are 6 numeric digits, valid for 5 minutes (300 seconds), with a 60-second resend cooldown and a maximum of 3 failed attempts.
- In preview/developer mode, Sonner toasts display simulated OTPs with a one-click "Auto-fill" action button.
- Registered users and active session must be persisted in `localStorage` under `blablacar_lk_auth_v1`.
- Guest users must be able to search and view routes without an account; only publishing, booking, and managing rides require an active authenticated session.
- Every source file must remain under 800 lines of code.

## Review Focus

- Malformed or landline phone numbers (e.g. `+94112...` Colombo landline or invalid prefixes) must be rejected with an informative error message.
- Expired OTP entries (attempting verification after 5 minutes) must fail gracefully and prompt the user to request a new code.
- Exhausted OTP attempts (entering 3 incorrect codes) must invalidate the challenge immediately.
- Resend OTP spamming before the 60-second cooldown expires must be blocked.
- Logout must safely reset `currentUser` to `null` without wiping the persistent `registeredUsers` catalog.

---

### Task 1: Domain Auth Engine & Phone OTP Lifecycle (`src/domain/auth.ts`)

**Files:**
- Create: `src/domain/auth.ts`
- Test: `tests/auth.test.ts`

**Interfaces:**
- Consumes: Nothing
- Produces:
  ```typescript
  export interface OtpChallenge {
    phone: string;
    code: string;
    expiresAt: number;
    resendAvailableAt: number;
    attemptsRemaining: number;
  }

  export function normalizeSriLankanMobile(raw: string): { valid: boolean; phone?: string; error?: string };
  export function createOtpChallenge(phone: string, now?: number): OtpChallenge;
  export function verifyOtpCode(
    challenge: OtpChallenge,
    inputCode: string,
    now?: number
  ): { ok: boolean; expired?: boolean; exhausted?: boolean; error?: string; updatedChallenge: OtpChallenge };
  ```

- [ ] **Step 1: Write the failing test in `tests/auth.test.ts`**

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeSriLankanMobile,
  createOtpChallenge,
  verifyOtpCode,
} from '../src/domain/auth.ts';

test('normalizeSriLankanMobile validates and formats local, 0-prefixed, and international numbers', () => {
  assert.deepEqual(normalizeSriLankanMobile('0771234567'), { valid: true, phone: '+94771234567' });
  assert.deepEqual(normalizeSriLankanMobile('+94 71 987 6543'), { valid: true, phone: '+94719876543' });
  assert.deepEqual(normalizeSriLankanMobile('761122334'), { valid: true, phone: '+94761122334' });
  assert.equal(normalizeSriLankanMobile('0112345678').valid, false); // Landline
  assert.equal(normalizeSriLankanMobile('12345').valid, false);
});

test('createOtpChallenge generates 6-digit code with 5-minute expiry and 60s resend cooldown', () => {
  const now = 1700000000000;
  const challenge = createOtpChallenge('+94771234567', now);
  assert.equal(challenge.phone, '+94771234567');
  assert.match(challenge.code, /^[0-9]{6}$/);
  assert.equal(challenge.expiresAt, now + 5 * 60 * 1000);
  assert.equal(challenge.resendAvailableAt, now + 60 * 1000);
  assert.equal(challenge.attemptsRemaining, 3);
});

test('verifyOtpCode succeeds on valid code, fails on wrong code, and tracks attempts/expiry', () => {
  const now = 1700000000000;
  const challenge = createOtpChallenge('+94771234567', now);
  
  // Wrong code
  const r1 = verifyOtpCode(challenge, '000000', now);
  assert.equal(r1.ok, false);
  assert.equal(r1.updatedChallenge.attemptsRemaining, 2);

  // Expired code
  const rExpired = verifyOtpCode(challenge, challenge.code, now + 301 * 1000);
  assert.equal(rExpired.ok, false);
  assert.equal(rExpired.expired, true);

  // Correct code
  const rSuccess = verifyOtpCode(challenge, challenge.code, now);
  assert.equal(rSuccess.ok, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types tests/auth.test.ts`  
Expected: FAIL with "Cannot find module '../src/domain/auth.ts'"

- [ ] **Step 3: Implement `src/domain/auth.ts`**

Implement Sri Lankan mobile regex normalization (`^(\+94|0)?(7[0-9]{8})$`), 6-digit cryptographic-random or pseudo-random OTP generation, 5-minute expiration calculation, and attempt decrement logic.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types tests/auth.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/auth.ts tests/auth.test.ts
git commit -m "feat(auth): implement Sri Lankan phone OTP verification domain engine"
```

---

### Task 2: Store Authentication & Identity Registry (`src/state/store.ts`)

**Files:**
- Modify: `src/state/store.ts`
- Test: `tests/store_auth.test.ts`

**Interfaces:**
- Consumes: `createOtpChallenge`, `verifyOtpCode`, `normalizeSriLankanMobile` from `src/domain/auth.ts`
- Produces on `MarketplaceStore`:
  ```typescript
  currentUser: UserProfile | null;
  registeredUsers: Record<string, UserProfile>;
  activeOtpChallenge: OtpChallenge | null;
  requestPhoneOtp(phone: string): { ok: boolean; code?: string; error?: string };
  verifyPhoneOtp(code: string): { ok: boolean; isNewUser: boolean; error?: string };
  completeRegistration(name: string, nic?: string): { ok: boolean; error?: string };
  logout(): void;
  ```

- [ ] **Step 1: Write the failing test in `tests/store_auth.test.ts`**

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createMarketplaceStore } from '../src/state/store.ts';

test('Store manages guest state, OTP request, verification, and new user onboarding', () => {
  const store = createMarketplaceStore();
  store.logout(); // Start as guest
  assert.equal(store.getState().currentUser, null);

  // 1. Request OTP for existing driver (+94772345678)
  const reqExisting = store.requestPhoneOtp('0772345678');
  assert.equal(reqExisting.ok, true);
  assert.ok(reqExisting.code);

  // 2. Verify OTP for existing driver
  const verExisting = store.verifyPhoneOtp(reqExisting.code!);
  assert.equal(verExisting.ok, true);
  assert.equal(verExisting.isNewUser, false);
  assert.equal(store.getState().currentUser?.phone, '+94772345678');
  assert.equal(store.getState().currentUser?.verifiedPhone, true);

  // 3. Logout and login new commuter (+94711112222)
  store.logout();
  const reqNew = store.requestPhoneOtp('0711112222');
  const verNew = store.verifyPhoneOtp(reqNew.code!);
  assert.equal(verNew.ok, true);
  assert.equal(verNew.isNewUser, true);

  // 4. Complete registration for new commuter
  const regResult = store.completeRegistration('Kavindi Silva', '199854301290');
  assert.equal(regResult.ok, true);
  assert.equal(store.getState().currentUser?.name, 'Kavindi Silva');
  assert.equal(store.getState().currentUser?.phone, '+94711112222');
  assert.equal(store.getState().currentUser?.verifiedPhone, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types tests/store_auth.test.ts`  
Expected: FAIL with method not found or invalid initial state.

- [ ] **Step 3: Implement Auth methods and State extensions in `src/state/store.ts`**

Add `registeredUsers` (pre-seeding Ashan Jayawardena), `activeOtpChallenge`, `currentUser: UserProfile | null`, and auth action methods with `localStorage` serialization.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types tests/store_auth.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/state/store.ts tests/store_auth.test.ts
git commit -m "feat(store): integrate phone OTP auth, user registry, and session persistence"
```

---

### Task 3: Interactive `AuthModal` Component (`src/components/AuthModal.tsx`)

**Files:**
- Create: `src/components/AuthModal.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `store.requestPhoneOtp`, `store.verifyPhoneOtp`, `store.completeRegistration`, `store.getState().activeOtpChallenge`
- Produces:
  ```typescript
  export function AuthModal({
    isOpen,
    onClose,
    onSuccess,
    store,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    store: MarketplaceStore;
  }): React.JSX.Element | null;
  ```

- [ ] **Step 1: Create `src/components/AuthModal.tsx`**

Implement a 3-step accessible dialog:
1. **Step 1 (Phone Number)**: Sri Lanka `+94` flag and prefix, 9-digit input with real-time formatting, validation message, and "Send Verification Code" button.
2. **Step 2 (OTP Entry)**: 6 separate digit boxes with auto-advance, paste handling, backspace navigation, 60-second cooldown timer for "Resend Code", and Sonner toast with "Auto-fill Code".
3. **Step 3 (New User Details)**: If `isNewUser: true`, collect Full Name and optional National Identity Card (NIC).
Trigger `onSuccess()` and `toast.success('Signed in successfully!')` when complete.

- [ ] **Step 2: Add styles in `src/styles.css`**

Add modal overlay, dialog card, 6-digit OTP input row, resend countdown badge, and button styles adhering to BlaBlaCar `#00aff5` styling tokens.

- [ ] **Step 3: Verify TypeScript and bundle build**

Run: `npm run build`  
Expected: PASS with 0 type errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/AuthModal.tsx src/styles.css
git commit -m "feat(ui): add interactive phone OTP AuthModal with Sonner integration"
```

---

### Task 4: Header Sign-In, Contextual Auth Gating & Data Isolation

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/views/PublishRideView.tsx`
- Modify: `src/views/RideDetailView.tsx`
- Modify: `src/views/YourRidesView.tsx`
- Modify: `src/views/ProfileView.tsx`

**Interfaces:**
- Consumes: `AuthModal` from `src/components/AuthModal.tsx`, `store.logout()`
- Produces: Seamless contextual gating for Publish, Book, Profile, and My Rides.

- [ ] **Step 1: Update `src/App.tsx` navigation**

- If `state.currentUser === null`: Show "Sign In" button in header (triggers `AuthModal`).
- If `state.currentUser !== null`: Show user avatar, name, and verified phone checkmark, plus a "Log Out" action.
- Mount `<AuthModal />` at root with global trigger capability.

- [ ] **Step 2: Update `src/views/PublishRideView.tsx`**

Check `if (!state.currentUser)` on entry: render an inviting banner explaining that drivers must verify their phone number to publish a ride, with a prominent "Sign In to Publish" button opening `AuthModal` (with `onSuccess` returning directly to wizard).

- [ ] **Step 3: Update `src/views/RideDetailView.tsx`**

When an unauthenticated guest clicks "Request to Book" or "Instant Book", open `AuthModal` with an `onSuccess` callback that immediately resumes booking submission.

- [ ] **Step 4: Update `src/views/YourRidesView.tsx` and `src/views/ProfileView.tsx`**

- In `YourRidesView`: Filter bookings by `passengerId === state.currentUser?.id`. If guest, prompt to sign in to see bookings.
- In `ProfileView`: Display authenticated user info, phone verification status, and a "Sign Out" button. If guest, show sign-in prompt.

- [ ] **Step 5: Run tests and full production build**

Run: `npm test && npm run build`  
Expected: All 12+ tests pass; Vite bundle compiles cleanly.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/views/PublishRideView.tsx src/views/RideDetailView.tsx src/views/YourRidesView.tsx src/views/ProfileView.tsx
git commit -m "feat(auth): connect contextual sign-in gates, header auth, and user isolation"
```

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-11-01-phone-otp-auth.md`.
