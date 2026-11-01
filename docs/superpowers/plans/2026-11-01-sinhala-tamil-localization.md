# Authentic Sinhala & Tamil Localization & Modern Typography Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide authentic, conversational Sri Lankan Sinhala and Tamil localization with Google Noto Unicode web fonts, comprehensive UI coverage across booking/pass/publish workflows, and deployment configuration for 1-click live hosting.

**Architecture:** Load `Noto Sans Sinhala` and `Noto Sans Tamil` alongside `Plus Jakarta Sans` for smooth typography rendering. Overhaul and expand the zero-dependency `t(locale, key)` dictionary in `src/domain/i18n.ts` with natural conversational Sri Lankan transit terms. Connect key commuter touchpoints (Publish Wizard, Ride Details, Ride Pass, Booking Modal) to the dictionary. Enforce parity via automated unit tests and supply `vercel.json` for SPA production deployment.

**Tech Stack:** React 19, TypeScript 5.7, Vite 6, Google Fonts (`Noto Sans Sinhala`, `Noto Sans Tamil`, `Plus Jakarta Sans`), Node test runner (`node:test`).

**Spec:** [docs/superpowers/specs/2026-11-01-localization-sinhala-tamil-modernization-design.md](file:///c:/Users/DELL/Downloads/blabla%20new/blablacar-lk/docs/superpowers/specs/2026-11-01-localization-sinhala-tamil-modernization-design.md)

---

## Global Constraints

- **File line ceiling**: Every modified file must remain strictly under 800 lines (ECC rule).
- **Zero runtime dependencies**: No third-party i18n libraries; preserve the typed `t(locale, key)` dictionary pattern.
- **Graceful fallback**: Any missing translation key in `si-LK` or `ta-LK` must fall back cleanly to `en-LK` without crashing.
- **Commits**: Follow Conventional Commits format (`feat:`, `test:`, `style:`).

---

## Review Focus

1. **Indic Diacritic Line Height**: In Sinhala and Tamil script, vowel marks (kombuva, aelepilla, pulli) can clip if line height is too tight. Ensure typography styles provide adequate line-height (`1.6`).
2. **Missing Key Fallbacks**: If a view uses a key that isn't defined in `si-LK`, `t()` must safely return the `en-LK` string rather than `undefined` or a raw key.
3. **Hub Name Localization in Forms**: In `PublishRideView`, ensure hub dropdowns render localized names based on `state.locale` while preserving hub IDs.
4. **SPA Direct URL 404s**: Navigating directly to a sub-route on static web hosting should rewrite to `/index.html` via `vercel.json`.
5. **No Layout Breakage**: Longer translated labels in buttons (e.g. `බෝඩිං පාස් එක බලන්න`) must wrap or fit without overflowing container widths on mobile.

---

### Task 1: Unicode Web Fonts & Social Meta Tags

**Files:**
- Modify: `index.html:1-17`
- Modify: `src/styles.css:20-45`
- Create: `vercel.json`

**Interfaces:**
- Consumes: Google Fonts API (`Noto Sans Sinhala`, `Noto Sans Tamil`, `Plus Jakarta Sans`)
- Produces: CSS variable `--font-sans` with full Sinhala & Tamil fallback stack, and SPA routing rewrites.

- [ ] **Step 1: Update `index.html` with Google Fonts preconnect and Open Graph meta tags**
  Add `Noto Sans Sinhala:wght@400;500;600;700` and `Noto Sans Tamil:wght@400;500;600;700` to Google Fonts link. Add `og:title`, `og:description`, `og:type` tags for WhatsApp/social sharing.

- [ ] **Step 2: Update CSS font-family in `src/styles.css`**
  Update `--font-sans` in `src/styles.css`:
  ```css
  --font-sans: 'Plus Jakarta Sans', 'Noto Sans Sinhala', 'Noto Sans Tamil', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  ```

- [ ] **Step 3: Create `vercel.json` for SPA client-side routing**
  Ensure any route (e.g. `/rides/:id`, `/search`, `/publish`) rewrites cleanly to `/index.html`:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```

- [ ] **Step 4: Verify build succeeds**
  Run: `npm run build`
  Expected: PASS with 0 errors.

- [ ] **Step 5: Commit**
  ```bash
  git add index.html src/styles.css vercel.json
  git commit -m "style: embed Noto Sans Sinhala & Tamil fonts and add SPA deployment config"
  ```

---

### Task 2: Authentic Conversational Dictionary & Parity Suite

**Files:**
- Modify: `src/domain/i18n.ts:1-150`
- Create: `tests/i18n.test.ts`

**Interfaces:**
- Consumes: `LocaleCode = 'en-LK' | 'si-LK' | 'ta-LK'`
- Produces: `t(locale: LocaleCode, key: string): string` with full dictionary parity across all 3 languages.

- [ ] **Step 1: Write failing parity unit test in `tests/i18n.test.ts`**
  Write tests verifying that every key in `en-LK` exists and is non-empty in `si-LK` and `ta-LK`, and that fallback behaves safely for unknown keys.

- [ ] **Step 2: Run test to verify it fails**
  Run: `node --test --experimental-strip-types tests/i18n.test.ts`
  Expected: FAIL on missing commuter keys.

- [ ] **Step 3: Overhaul and expand `src/domain/i18n.ts`**
  Rewrite existing keys with natural colloquial Sri Lankan phrasing (e.g. `රයිඩ් එකක් දාන්න`, `මගේ රයිඩ්ස්`, `වියදම බෙදාගැනීම`, `වාහනයට නැග්ගම මුදලින්`, `පිටත්වන තැන`, `යන තැන`).
  Add missing keys for:
  - `ridepass.title`: "Digital Boarding Pass" / "ඩිජිටල් බෝඩිං පාස් එක" / "டிஜிட்டல் போர்டிங் பாஸ்"
  - `ridepass.pin`: "Boarding PIN" / "බෝඩිං PIN අංකය" / "போர்டிங் PIN எண்"
  - `ridepass.driver`: "Driver" / "රියදුරු" / "ஓட்டுநர்"
  - `ridepass.whatsapp`: "Chat on WhatsApp" / "WhatsApp මගින් කතා කරන්න" / "WhatsApp இல் பேசுக"
  - `ridepass.safety_share`: "Share Safety Details" / "ආරක්ෂිත විස්තර යවන්න" / "பாதுகாப்பு தகவல்களைப் பகிர்க"
  - `luggage.title`: "Luggage" / "ලගේජ්" / "பயணப் பொதி"
  - `luggage.backpack`: "Backpack only" / "කුඩා බෑග් පමණි" / "சிறிய பை மட்டும்"
  - `luggage.medium`: "Medium suitcase" / "මධ්‍යම බෑග්" / "நடுத்தர பை"
  - `luggage.large`: "Large luggage" / "ලොකු ලගේජ්" / "பெரிய சூட்கேஸ்"
  - `booking.seats_needed`: "Seats needed" / "අවශ්‍ය ආසන ගණන" / "தேவையான இருக்கைகள்"
  - `booking.confirm`: "Confirm Booking" / "වෙන්කිරීම තහවුරු කරන්න" / "முன்பதிவை உறுதிசெய்க"
  - `booking.cancel`: "Close" / "වසන්න" / "மூடுக"
  - `publish.return_trip`: "Publish Return Trip" / "ආපසු ගමනත් දාන්න" / "திரும்பு பயணத்தையும் பகிர்க"

- [ ] **Step 4: Run test to verify it passes**
  Run: `node --test --experimental-strip-types tests/i18n.test.ts`
  Expected: PASS with 100% dictionary parity.

- [ ] **Step 5: Commit**
  ```bash
  git add src/domain/i18n.ts tests/i18n.test.ts
  git commit -m "feat: modernize Sinhala & Tamil dictionaries with authentic colloquial terms and parity tests"
  ```

---

### Task 3: Commuter Touchpoint Integration in Views

**Files:**
- Modify: `src/views/PublishRideView.tsx:210-250`
- Modify: `src/views/RideDetailView.tsx`
- Modify: `src/components/RidePassModal.tsx`
- Modify: `src/components/BookingModal.tsx`

**Interfaces:**
- Consumes: `t(locale, key)` from `src/domain/i18n.ts`, `locale` from `store.getState().locale`
- Produces: Dynamically localized UI for Publish Wizard, Ride Details, Ride Pass Modal, and Booking Modal.

- [ ] **Step 1: Localize Hub Selectors & Return Trip in `PublishRideView.tsx`**
  Make hub dropdown options render `{h.name[locale.slice(0, 2) as 'en' | 'si' | 'ta'] || h.name.en}` so drivers see city names in their chosen language. Use `t()` for luggage labels and return trip toggle.

- [ ] **Step 2: Localize Ride Pass Modal in `src/components/RidePassModal.tsx`**
  Read `locale` from store and use `t(locale, 'ridepass.*')` for Boarding Pass title, PIN label, WhatsApp action, and Safety Share action.

- [ ] **Step 3: Localize Booking Modal in `src/components/BookingModal.tsx`**
  Read `locale` from store and use `t(locale, 'booking.*')` for seat labels, pricing breakdown, and confirmation CTA.

- [ ] **Step 4: Localize Ride Detail View in `src/views/RideDetailView.tsx`**
  Use `t()` for luggage capacity, comfort badges, and boarding pass button label.

- [ ] **Step 5: Run all unit tests and build check**
  Run: `npm test && npm run build`
  Expected: PASS with all 32+ tests green and clean build.

- [ ] **Step 6: Commit**
  ```bash
  git add src/views/PublishRideView.tsx src/views/RideDetailView.tsx src/components/RidePassModal.tsx src/components/BookingModal.tsx
  git commit -m "feat: connect Ride Pass, Booking, and Publish touchpoints to trilingual dictionary"
  ```

---

### Task 4: Full System Verification & Review

- [ ] **Step 1: Run full test suite**
  Run: `npm test`
  Expected: All 32+ tests passing.

- [ ] **Step 2: Run production build**
  Run: `npm run build`
  Expected: Zero TypeScript errors, bundle generated in `dist/`.

- [ ] **Step 3: Verify line count ceiling**
  Verify all modified files are strictly under 800 lines:
  - `src/domain/i18n.ts` (<800)
  - `src/views/PublishRideView.tsx` (<800)
  - `src/components/RidePassModal.tsx` (<800)
  - `src/components/BookingModal.tsx` (<800)

- [ ] **Step 4: Final commit & ready for deployment**
  ```bash
  git commit --allow-empty -m "chore: verify full pre-deployment readiness"
  ```
