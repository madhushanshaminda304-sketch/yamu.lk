# Complete Multilingual System (EN, SI, TA, RU) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a comprehensive, zero-overhead multilingual system supporting English (`en-LK`), Sinhala (`si-LK`), Tamil (`ta-LK`), and Russian (`ru-RU`) with modular JSON translation files, `localStorage` persistence, Sonner toast localization, Cyrillic & Sinhala font support, and dynamic hub fallbacks.

**Architecture:** Split translations into standalone JSON files in `src/locales/{en,si,ta,ru}.json` imported via a type-safe i18n layer in `src/domain/i18n.ts`. Store persistence utilizes `localStorage` (`yamo_locale`) with instant boot hydration and `<html lang="...">` synchronization.

**Tech Stack:** React 19, TypeScript, Sonner, Vite, Capacitor Android, Phosphor Icons.

---

## Global Constraints

- Preserve 100% test passing rate across all 11 test suites in `tests/*.test.ts`.
- Zero bundle regression — no heavy external dependencies that inflate mobile bundle size.
- Exact key parity across all 4 language dictionaries (`en`, `si`, `ta`, `ru`) with zero empty strings.
- Mobile touch targets for language switchers must maintain $\ge 44\text{px}$ touch targets without horizontal overflow.
- Clean fallback to English whenever a dynamic translation is missing.

---

## Tasks

### Task 1: Separate JSON Translation Files & i18n Layer
- [ ] Create `src/locales/en.json`, `src/locales/si.json`, `src/locales/ta.json`, and `src/locales/ru.json`.
- [ ] Migrate all 66+ existing keys plus new `toast.*` keys into each JSON file.
- [ ] In `src/domain/i18n.ts`, export `type LocaleCode = 'en-LK' | 'si-LK' | 'ta-LK' | 'ru-RU'`.
- [ ] Export `LOCALE_META` catalog with flags, short codes (`EN`, `සිං`, `தமிழ்`, `РУС`), and display names.
- [ ] Export `getValidLocale(raw: string | null): LocaleCode` with safe `'en-LK'` fallback.

### Task 2: LocalStorage Persistence & Store Sync
- [ ] In `src/state/store.ts`, read initial locale from `localStorage.getItem('yamo_locale')`.
- [ ] In `store.setLocale(locale)`, persist choice to `localStorage.setItem('yamo_locale', locale)`.
- [ ] In `store.setLocale(locale)` and main initialization, update `document.documentElement.lang = locale.slice(0, 2)`.

### Task 3: Dynamic Hub Catalog Localization (Russian + Fallbacks)
- [ ] In `src/domain/hubs.ts`, expand `Hub['name']` to include optional or typed `ru?: string`.
- [ ] Add authentic Russian transliterations for all 16 major transit hubs (Colombo, Makumbura, Kandy, Galle, Matara, Katunayake BIA, Ella, Jaffna, etc.).
- [ ] Ensure `getHubName(hub, locale)` falls back smoothly to English if a localized string is undefined.

### Task 4: Localize Sonner Toasts & Interactive User Messages
- [ ] In `src/locales/*.json`, add translations for `toast.booking_confirmed`, `toast.booking_cancelled`, `toast.alert_created`, `toast.alert_invalid_email`, `toast.location_located`, `toast.location_denied`, `toast.publish_success`.
- [ ] Update `src/views/RideDetailView.tsx` to use `t(locale, 'toast.booking_confirmed')`.
- [ ] Update `src/views/SearchView.tsx` to use localized toast strings for location and ride alerts.
- [ ] Update `src/views/PublishRideView.tsx` to use localized toast strings on publishing.

### Task 5: Upgrade Desktop & Mobile Language Selectors
- [ ] In `src/App.tsx`, update the desktop header `.lang-switch` to render all 4 languages (`EN`, `සිං`, `தமிழ்`, `РУС`).
- [ ] In `src/components/MobileTopBar.tsx`, update the mobile header language segmented pill strip to render all 4 languages cleanly without wrapping or overflow.

### Task 6: Fonts & HTML Metadata Support
- [ ] In `index.html`, ensure the Google Fonts link explicitly loads Cyrillic characters for `Plus Jakarta Sans`.
- [ ] Verify font fallback chain in `src/styles.css`.

### Task 7: Verification & Testing
- [ ] Update `tests/i18n.test.ts` to assert 4-way parity across `en-LK`, `si-LK`, `ta-LK`, and `ru-RU`.
- [ ] Run `npm test` and verify all 128+ tests pass.
- [ ] Run `npm run build` (`tsc --noEmit && vite build`) to confirm zero type errors.
- [ ] Run `npx cap sync android` to ensure web assets sync to native container.
- [ ] Commit and push changes to GitHub.
