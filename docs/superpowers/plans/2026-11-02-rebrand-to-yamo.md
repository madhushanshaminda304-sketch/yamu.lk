# Rebrand to Yamo & Ceylon Emerald Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand the application from Yamu to Yamo (yamo.lk) and replace the BlaBlaCar cyan/navy styling with the Ceylon Emerald & Sunburst Gold color system.

**Architecture:** Update CSS custom properties in `src/styles.css` to transform all UI components into the Ceylon Emerald & Gold theme. Overhaul brand components (`YamoLogo.tsx`), trilingual dictionaries (`i18n.ts`), safety sharing templates (`sharing.ts`), and HTML/OpenGraph metadata (`index.html`).

**Tech Stack:** React 19, TypeScript, CSS Variables, SVG, Node Test Runner.

**Spec:** Rebrand from Yamu (`yamu.lk`) to Yamo (`yamo.lk`). Ceylon Emerald `#047857` (Primary), Sunburst Gold `#F59E0B` (Accent), Deep Pine `#064E3B` (Headings/Dark), Frost Mint `#F0FDF4` (Surface), Vibrant Mint `#10B981` (Passenger ribbon).

## Global Constraints
- Brand name: strictly **Yamo** (`yamo.lk`).
- Trilingual labels: English "Yamo", Sinhala "යමෝ", Tamil "யாமோ".
- All 38 automated tests must remain passing.
- Zero build warnings with Vite 6.

## Review Focus
- Check that all buttons, search highlights, and icons reflect Ceylon Emerald `#047857` and Gold `#F59E0B`.
- Check that WhatsApp share links and SMS/safety share text refer to `Yamo (yamo.lk)`.
- Ensure no lingering references to "Yamu" remain in user-visible views.
- Ensure `tests/sharing.test.ts` assertions match `🛡️ Yamo Trip Share:`.
- Ensure `index.html` OpenGraph and Twitter card metadata reflects `Yamo.lk`.

---

### Task 1: Update Brand Color System in `src/styles.css`
**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Replace CSS root tokens with Ceylon Emerald & Sunburst Gold palette**
- [ ] **Step 2: Update card shadows, gradients, and CTA button hover states to emerald/gold**
- [ ] **Step 3: Verify build passes without syntax errors**

### Task 2: Create `YamoLogo.tsx` with Emerald & Gold Ribbon Emblem
**Files:**
- Create: `src/components/YamoLogo.tsx`
- Modify: `src/components/RidePassModal.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `src/components/YamoLogo.tsx` with `YamoIcon` and `YamoBrand`**
- [ ] **Step 2: Update imports in `App.tsx` and `RidePassModal.tsx`**
- [ ] **Step 3: Verify rendering with brand badge `.lk` in Sunburst Gold**

### Task 3: Update Domain Sharing & WhatsApp Templates
**Files:**
- Modify: `src/domain/sharing.ts`
- Modify: `tests/sharing.test.ts`

- [ ] **Step 1: Update WhatsApp message and safety share text in `src/domain/sharing.ts` from Yamu to Yamo**
- [ ] **Step 2: Update test assertion in `tests/sharing.test.ts` to expect `🛡️ Yamo Trip Share:`**
- [ ] **Step 3: Run `npm test` to verify passing**

### Task 4: Update Trilingual i18n Dictionaries & App Copy
**Files:**
- Modify: `src/domain/i18n.ts`
- Modify: `src/state/store.ts`
- Modify: `src/components/AuthModal.tsx`
- Modify: `index.html`

- [ ] **Step 1: Update `src/domain/i18n.ts` brand title and copy across en-LK, si-LK (යමෝ), and ta-LK (யாமோ)**
- [ ] **Step 2: Update welcome notifications and profile defaults in `src/state/store.ts` and `AuthModal.tsx`**
- [ ] **Step 3: Update `index.html` page title, meta description, and SVG favicon with emerald/gold palette**
- [ ] **Step 4: Run full test suite: `npm test`**
- [ ] **Step 5: Run production build: `npm run build`**
