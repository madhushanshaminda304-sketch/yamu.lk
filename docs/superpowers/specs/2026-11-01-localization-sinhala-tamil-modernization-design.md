# Authentic Sri Lankan Localization & Modern Typography Design

- **Date**: 2026-11-01
- **Status**: Proposed
- **Author**: Antigravity & Engineering Team
- **Target Platform**: `blablacar-lk` (React 18 + Vite + TypeScript)

---

## 1. Intent & Context

The Yamu (`yamu.lk`) platform connects intercity commuters across Sri Lanka (Southern Expressway E01, Colombo–Kandy, Jaffna A9, Ella). While an `en-LK`, `si-LK`, and `ta-LK` switcher was introduced, the non-English experience currently feels unnatural:
1. **Visual Typography**: In `index.html`, only `Plus Jakarta Sans` is loaded. Because it lacks Unicode support for Sinhala (`U+0D80–U+0DFF`) and Tamil (`U+0B80–U+0BFF`), Windows and mobile browsers fall back to legacy system fonts (e.g. *Iskoola Pota* or *Nirmala UI*), rendering jagged, dated, serif-like script.
2. **Vocabulary & Register**: The dictionary in `src/domain/i18n.ts` uses formal, bureaucratic, and academic translations (e.g., `ආසනයක් පිරිනමන්න` or `පෙරහන් කරන්න`). Real Sri Lankan transit tech (PickMe, Uber Sri Lanka, Helakuru) uses conversational everyday commuter vocabulary and natural loan words (e.g. `Ride එකක් දාන්න`, `වියදම බෙදාගැනීම`, `කාර් එකේ විස්තර`).
3. **Incomplete Coverage**: Major commuter surfaces (Publish Wizard, Ride Details, Digital Ride Pass, Booking Modal) are hardcoded in English, creating a disjointed "half-translated" experience.

This design upgrades Yamu to **Approach 1**: Modern Sinhala & Tamil localization with Google Noto web fonts and authentic conversational phrasing.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Smooth, Modern Typography**: Load Google Fonts `Noto Sans Sinhala` and `Noto Sans Tamil` (weights 400, 500, 600, 700) and update CSS font stacks so Indic scripts render as crisply as Latin characters.
- **Authentic Conversational Voice**: Replace textbook translations with natural Sri Lankan everyday transit phrasing across both Sinhala and Tamil dictionaries.
- **Consistent Commuter Coverage**: Extend `t(locale, key)` dictionary coverage to:
  - Navigation & Language Switcher
  - Search Form & Hub dropdowns
  - Sort & Filter criteria (AC, luggage, max 2 in back, instant booking)
  - Ride details & Digital Ride Pass / Boarding PIN
  - Booking & Seat Reservation flow
  - Publish Ride Wizard step headers & buttons
- **Test Integrity**: Provide automated dictionary parity unit tests verifying 100% key coverage across all three supported locales.

### Non-Goals
- Adding heavy third-party i18n libraries (e.g., `i18next`, `react-intl`); Yamu's typed, zero-dependency `t(locale, key)` pattern is performant, lightweight (<2KB), and fits perfectly.
- Translating freeform user-generated inputs (e.g. driver bio descriptions, custom chat notes).
- Altering the core business logic or ride pricing calculations.

### Anti-Goals
- Overly formal or archaic phrasing that alienates daily commuters.
- Layout breakage or button truncation caused by script height or string length variations.

---

## 3. Constraints
- **File Size Ceiling**: Strictly keep all modified files under 800 lines (per ECC rules).
- **Zero New Runtime Dependencies**: Use web fonts loaded via Google CDN and existing TypeScript types.
- **Backward Compatibility**: Missing keys must gracefully fall back to `en-LK` without crashing.

---

## 4. Approaches Considered

1. **Approach 1: Modern Sinhala & Tamil + Noto Web Fonts (Chosen)**:
   - Load `Noto Sans Sinhala` and `Noto Sans Tamil`.
   - Modernize dictionary with authentic PickMe/Uber SL colloquial commuter phrasing.
   - Expand `t()` coverage across main views.
   - *Trade-off*: Adds ~30-40 new translation keys, but delivers an authentic, trustworthy, top-tier Sri Lankan product.

2. **Approach 2: English Default with Polished Bilingual Toggle**:
   - Keep English as default, fix fonts, but only translate home hero and search bar.
   - *Trade-off*: Leaves deep views untranslated, leading to inconsistent user experience.

3. **Approach 3: Pure English-Only**:
   - Remove language switcher and make the app 100% English.
   - *Trade-off*: Eliminates translation overhead, but excludes non-English native speakers along provincial corridors.

---

## 5. Architectural & Implementation Details

### A. Typography & Font Stack (`index.html` & `src/styles.css`)
In `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+Sinhala:wght@400;500;600;700&family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

In `src/styles.css`:
```css
--font-sans: 'Plus Jakarta Sans', 'Noto Sans Sinhala', 'Noto Sans Tamil', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
```
For elements displaying Sinhala/Tamil text, slight adjustments to `line-height: 1.6` prevent diacritical marks (kombuva, aelepilla, pulli) from clipping.

### B. Natural Vocabulary Overhaul (`src/domain/i18n.ts`)

| English Key | Current (Mechanical) | Proposed Sinhala (Colloquial & Clear) | Proposed Tamil (Natural & Clear) |
|---|---|---|---|
| `nav.publish` | ආසනයක් පිරිනමන්න | රයිඩ් එකක් දාන්න (Offer a ride) | பயணத்தைப் பகிருங்கள் (Share a ride) |
| `nav.rides` | මගේ ගමන් | මගේ රයිඩ්ස් | எனது பயணங்கள் |
| `hero.title` | අඩුම LKR පිරිවැය හවුල් මිලකට ඔබේ ගමන තෝරාගන්න | අඩුම වියදමකින් පහසුවෙන්ම ගමනක් යන්න | குறைந்த செலவில் சௌகரியமான பயணம் |
| `hero.subtitle` | ...තහවුරු කළ රියදුරන් සමඟ ආරක්ෂිතව ගමන් කරන්න | දක්ෂිණ අධිවේගී මාර්ගයේ (E01) සිට මහනුවර, ඇල්ල සහ යාපනය දක්වා තහවුරු කළ අය සමඟ එකට යමු. | அதிவேக நெடுஞ்சாலை, கண்டி, யாழ்ப்பாணம் வரை சரிபார்க்கப்பட்ட உறுப்பினர்களுடன் பயணத்தைப் பகிருங்கள். |
| `search.from` | පිටත් වන ස්ථානය | පිටත්වන තැන | புறப்படும் இடம் |
| `search.to` | ගමනාන්තය | යන තැන | சேருமிடம் |
| `filter.max_two_back` | පසුපස අසුනේ උපරිම 2 පමණි | පිටුපස සීට් එකේ උපරිම 2යි | பின் இருக்கையில் 2 பேர் மட்டும் |
| `filter.ac` | වායුසමනය (AC) සහිත | AC සහිතයි | AC வசதி உண்டு |
| `booking.instant` | ක්ෂණික වෙන්කිරීම (Instant) | ක්ෂණිකව බුක් කරන්න (Instant) | உடனடி முன்பதிவு (Instant) |
| `booking.manual` | අනුමැතිය ඉල්ලන්න (Request) | රියදුරුගෙන් අනුමැතිය ඉල්ලන්න | ஓட்டுநரிடம் அனுமதி கோருக |
| `settlement.cash` | ගමනේදී මුදලින් (LKR) | වාහනයට නැග්ගම මුදලින් (LKR) | பயணத்தின் போது ரொக்கம் (LKR) |
| `settlement.lankaqr` | ගමනේදී LankaQR මගින් | වාහනයට නැග්ගම LankaQR | பயணத்தின் போது LankaQR |
| `scam.banner` | වංචාවලින් ආරක්ෂා වීමට... | වංචාවලට අහුවෙන්න එපා: ගෙවීම් කරන්න කියලා වෙනත් Links වලට යන්න එපා. වාහනයට නැග්ගම මුදලින් හෝ LankaQR මගින් කෙලින්ම ගෙවන්න. | மோசடிகளில் சிக்காதீர்கள்: பணம் செலுத்த எந்த இணைப்புகளையும் (Links) திறக்க வேண்டாம். வாகனத்தில் ஏறியதும் ரொக்கமாக அல்லது LankaQR மூலம் ஓட்டுநரிடம் நேரடியாகச் செலுத்துங்கள். |
| `ridepass.title` | Digital Boarding Pass | ඩිජිටල් බෝඩිං පාස් එක | டிஜிட்டல் போர்டிங் பாஸ் |
| `ridepass.pin` | Boarding PIN | බෝඩිං PIN අංකය | போர்டிං PIN எண் |
| `luggage.title` | Luggage | ලගේජ් පහසුකම් | பயணப் பொதி வசதி |

### C. Parity Testing (`tests/i18n.test.ts`)
Add a dedicated test verifying:
1. Every key in `en-LK` exists in `si-LK` and `ta-LK`.
2. No empty strings or unresolved keys in any dictionary.
3. Fallback behaves safely when an unknown key is queried.

---

## 6. What's Left for the Builder
- Apply font links to `index.html` and update CSS font variables.
- Update `src/domain/i18n.ts` with natural colloquial phrases.
- Update `PublishRideView.tsx`, `RideDetailView.tsx`, `RidePassModal.tsx`, and `BookingModal.tsx` to read dynamic `t()` labels for key interactions.
- Run `npm test` and `npm run build` to verify zero regression.
