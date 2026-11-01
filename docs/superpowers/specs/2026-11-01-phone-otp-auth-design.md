# Design Spec: Passwordless Sri Lankan Phone OTP Authentication & Identity Verification

**Date**: 2026-11-01  
**Project**: BlaBlaCar Sri Lanka (`blablacar-lk`)  
**Status**: Pending Approval  

---

## 1. Intent & The Why

BlaBlaCar Sri Lanka requires authentic identity verification tailored to local commuter habits. In Sri Lanka, email-based logins suffer from high abandonment, whereas WhatsApp and mobile SMS are ubiquitous. Passengers and drivers need a frictionless, passwordless login rooted in their Sri Lankan mobile number (`+94 7X XXX XXXX`) combined with a timed 6-digit One-Time Password (OTP). 

Verifying the mobile number establishes the foundation of the trust economy: it prevents spam bookings, enforces authentic communication, and powers the verified driver/passenger trust badge alongside Sri Lankan National Identity Card (NIC) verification.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- **Passwordless Mobile Login**: Enter Sri Lankan mobile number (`+9471...`, `+9477...`, etc.) and receive a 6-digit OTP to authenticate.
- **Auto-Onboarding for New Commuters**: If the phone number is new, seamlessly prompt for full name and optional NIC number.
- **Trust Badge Elevation**: Automatically mark `verifiedPhone: true` upon successful OTP entry, updating the user's trust profile and Super Driver eligibility.
- **Contextual Auth Gating**: Allow unauthenticated guests to search rides, inspect routes, and calculate fares; prompt for sign-in only when attempting to publish a ride, book a seat, or message a driver, then resume the interrupted action.
- **Interactive Developer Experience**: Deliver realistic OTP verification in client-side / preview mode using Emil Kowalski's `sonner` toasts with a 60-second resend cooldown and a 1-click "Auto-fill OTP" action.
- **Session Persistence**: Persist the authenticated user session in browser storage (`localStorage`) with a clear "Sign Out" option in the navigation header and profile.

### Non-Goals
- Integration with paid external telecom SMS aggregators (e.g., Dialog/Mobitel Ideamart or Twilio SMS API) in this iteration—the OTP engine runs via client-side simulation with extensible provider hooks.
- Social OAuth (Google, Facebook, Apple) in this milestone—focus remains on Sri Lankan mobile identity.

### Anti-Goals
- No forced sign-in for casual browsing or fare estimation—visitors must be able to explore Sri Lankan corridors and see pricing without an account.
- No silent failures: invalid OTPs, expired codes, or malformed phone numbers must produce clear, accessible error messages.

---

## 3. Approaches Considered & Selected

1. **Approach 1: Passwordless Mobile OTP First (SELECTED)**
   - *Rationale*: Matches PickMe, Uber Sri Lanka, and BlaBlaCar India. Minimizes friction, guarantees phone verification at account creation, and aligns with Sri Lankan user expectations.
2. **Approach 2: Email & Password with Secondary Phone OTP (REJECTED)**
   - *Drawback*: Excessive friction; carpooling commuters do not want to manage passwords for localized transit.
3. **Approach 3: Demo Persona Switcher Only (REJECTED)**
   - *Drawback*: Lacks genuine guest-to-member conversion, auth gates, and verifiable authentication state.

---

## 4. Architectural & Component Design

### A. Domain & State Layer (`src/domain/auth.ts`, `src/state/store.ts`)
- **`OtpChallenge` Interface**:
  ```typescript
  export interface OtpChallenge {
    phone: string;
    code: string; // 6 digits
    expiresAt: number; // Unix timestamp (5 minutes)
    resendAvailableAt: number; // Unix timestamp (60 seconds)
    attemptsRemaining: number; // Max 3
  }
  ```
- **Validation**: Strict validation of Sri Lankan mobile numbers via regex:
  `^(\+94|0)?7[0-9]{8}$` (normalizing to international E.164 format `+947XXXXXXXX`).
- **Store Extensions**:
  - `currentUser: UserProfile | null` (supports unauthenticated guest state).
  - `activeOtpChallenge: OtpChallenge | null`.
  - Actions: `requestPhoneOtp(phone)`, `verifyPhoneOtp(code, newUserData?)`, `logout()`, `updateUserVerification(...)`.

### B. User Interface & Modals (`src/components/AuthModal.tsx`, `src/App.tsx`)
- **`AuthModal`**:
  - Multi-step modal: 
    1. *Phone Input*: Country selector (+94 Sri Lanka) + 9-digit subscriber number with input formatting.
    2. *OTP Input*: 6 individual digit inputs with auto-focus, paste support, and countdown timer (`Resend in 0:48`).
    3. *New User Profile Details*: If phone number is unregistered, collect Name and NIC.
  - Action Resume: Accepts an `onSuccess?: () => void` callback so users attempting to book or publish are returned to their flow seamlessly.
- **Header Updates (`App.tsx`)**:
  - Unauthenticated: Display "Sign In" button with phone icon.
  - Authenticated: Display user avatar, verified checkmark, and dropdown (Profile, Your Rides, Log Out).
- **Sonner Toast Integration**:
  - On OTP generation: `toast.info('Verification Code Sent', { description: 'Your code is: 481920 (Simulated SMS)', action: { label: 'Auto-fill', onClick: () => fillOtp('481920') } })`.

---

## 5. What is Left to the Builder

- Exact styling tokens matching BlaBlaCar brand colors (`#00aff5` primary, `#054752` navy).
- Unit tests covering OTP expiration, attempt exhaustion, phone normalization, and user session persistence.
- Component breakdown ensuring `<800` lines per file.
