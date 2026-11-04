# Yamo language support

The website uses `/en/`, `/si/`, and `/ta/`. One React application and one marketplace store serve every language. Ride IDs, booking IDs, search parameters, and user content are shared across languages.

## Development

Use Node 22.13 or newer and install the locked dependencies:

```sh
npm ci
npm run dev
```

An explicit language URL takes precedence over the saved choice. The root `/` and old links such as `/search?from=colombo&to=galle` redirect to the saved language, then a supported device language, then English. Switching languages replaces the current history entry, preserves query strings, fragments and location state, and keeps the current screen mounted so its draft survives. Normal navigation still adds history entries.

Use `Link`, `useNavigate`, and `useLocation` from `src/components/LocalizedRouter.tsx` for application navigation. Use React Router directly for route definitions, parameters and search parameters. The localized `useLocation` exposes the path without its language prefix so existing mobile title and active-tab logic works consistently.

The Android app uses the same bundled translations and saved setting. Its back handler recognizes language-prefixed homepages. Physical Android device verification is still required before release.

## Translations

Existing semantic translation keys remain in `src/locales/en.json`, `si.json`, and `ta.json`, accessed through `t(locale, key)`.

Additional interface copy lives in `src/locales/ui.json`. The English source text is its key; each value contains translations in the fixed order **Sinhala, Tamil**. In a React component, use `useUiText()` and `tr('English source')`. Supply a component's explicit locale to `useUiText(locale)` when applicable.

For sentences containing dynamic data, use one complete template with numbered placeholders, for example `tr('Ride from {0} to {1} with {2}', { 0: origin, 1: destination, 2: driverName })`. The catalog supports reordering. Do not translate user-entered names, custom titles, driver notes, chat messages, or form values. Curated hub names use `getHubDisplayName(hub, locale)`.

Notifications retain their source templates and values, and rerender when the language changes. English fallback remains available for unknown messages. Date formatting uses the Colombo timezone and falls back to bundled Sinhala/Tamil labels on browsers missing the relevant locale data.

The added translations are drafts and should receive a native-speaker review, especially booking errors, safety copy and terminology. Existing English product claims and demo authentication behavior also require a separate readiness review.

## Verification

```sh
npm test
npm run check:i18n
npm run test:browser
npm run build
```

Browser tests use installed Google Chrome by default. Install it or change the Playwright channel in `playwright.config.ts`. The test server disables live Supabase synchronization, and browser tests block external requests. They do not publish rides or modify the live database.

Tests cover language precedence, legacy links, refreshes, history, search filters, publishing drafts, booking drafts, modal validation, mobile tabs, metadata, notification rendering, translation placeholders and Android back-button route handling. The fixed-text audit catches newly introduced unlocalized JSX text; it is not a replacement for reviewing conditional text or translation quality.

## Build and hosting

`npm run build` emits translated homepage HTML into `dist/en/`, `dist/si/`, and `dist/ta/` before JavaScript loads. Search results and account screens remain client rendered.

Set `SITE_URL` (or `VITE_SITE_URL`) to the actual public origin in the hosting environment, for example `https://your-domain.example`, before building. This adds absolute canonical and reciprocal `hreflang` links to the prerendered homepages. While the application runs, metadata uses the actual browser origin. Private and unknown routes receive `noindex` metadata.

Keep the existing SPA fallback for deep links. Verify both `/si/` and `/si/rides/<id>` on the selected host before release. Capacitor continues to package `dist` with `npm run cap:sync`.

## Copy and layout review

Navigation labels, page headings, helper text and complete summaries have separate contextual keys in the locale catalogs. Write for the action and available space rather than mirroring English word order. Use one complete message for each sentence, with named placeholders, and preserve user-entered content.

The tone is friendly and professional. Sinhala uses consistent terms for trips, accounts and bookings; Tamil uses Sri Lankan terminology such as சாரதி where appropriate. Proper names and LankaQR remain unchanged. New contextual copy is an editorial draft, not a claim of independent native-speaker approval.

Mobile page titles occupy their own row. Native-script font stacks, expandable controls and bounded grid columns let translated text fit without hiding it. The layout browser tests check clipping and off-screen controls, including all six publishing steps. Retired Russian URLs redirect to the equivalent supported-language route.

Fonts are bundled locally: Manrope for Latin text, Noto Sans Sinhala and Noto Sans Tamil for native scripts. The application does not request Google Fonts. SIL Open Font License texts are included under public/font-licenses.
