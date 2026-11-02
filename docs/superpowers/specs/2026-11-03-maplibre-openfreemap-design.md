# Yamo — Map Visual Upgrade Design: MapLibre GL JS & OpenFreeMap Liberty

- **Date:** 2026-11-03
- **Topic:** Vector Map Engine Upgrade (CARTO Raster Removal -> MapLibre GL JS + OpenFreeMap Liberty)
- **Status:** Approved / In Design
- **Target Application:** Yamo Sri Lanka (`yamo.lk` / `lk.yamo.app`)

---

## 1. Intent & Purpose

Yamo's existing route visualization relies on raster tiles from CARTO Voyager (`cartocdn.com`), which can feel washed out, trigger API key requirements, and lack the crispness and high-information density of modern vector maps on high-DPI smartphone displays.

The objective is to replace the basemap engine with **MapLibre GL JS** and **OpenFreeMap hosted vector tiles** using the **Liberty style** (`https://tiles.openfreemap.org/styles/liberty`). This brings clear highways, secondary roads, street and town names, rivers, green spaces, and building footprints across Sri Lanka, while preserving Yamo's custom UI, brand colors, live tracking radar, and booking workflows.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- **Eliminate CARTO:** Completely remove all `cartocdn.com` requests and any CARTO API key notices.
- **Modern Vector Basemap:** Load OpenFreeMap Liberty vector tiles hosted at `https://tiles.openfreemap.org/styles/liberty`.
- **Preserve Yamo Design & Branding:**
  - Map container dimensions and rounded corners (`border-radius: 14px`, `overflow: hidden`).
  - Active route line in Ceylon Emerald (`#059669` core with `#064e3b` casing shadow).
  - Custom HTML floating pill markers for Pickup (`PICKUP` emerald pill) and Drop-off (`DROP-OFF` slate pill).
  - Numbered circular markers for intermediate corridor stopovers.
  - Live radar participant pins (driver car emoji 🚗 and passenger avatar 🧍‍♂️).
  - Top live radar bar, quick status chips, and bottom external navigation links (Google Maps & Waze).
- **Smooth Navigation & Fitting:** Automatically fit bounds to enclose all waypoints and route polyline with proper padding (`fitBounds`).
- **Clean Lifecycle & Performance:** Single MapLibre instance per mount, responsive resize observer, and thorough cleanup on unmount (`map.remove()`).
- **Sri Lanka Verification:** Ensure high-clarity rendering across major cities: Colombo, Negombo, Kandy, Galle, Matara, Kurunegala, Jaffna, and Ella.

### Non-Goals
- No changes to backend, Firebase, Supabase Realtime, authentication, booking logic, seat calculation, or pricing.
- No changes to the OSRM route geometry generation in `src/domain/routeMapGeometry.ts`.
- No forced redesign of the surrounding view layouts (`SearchView`, `PublishRideView`, `RidePassModal`, `RouteCorridorMap`).

### Anti-Goals
- Do not introduce paid tile provider dependencies or require API keys.
- Do not break offline or slow-network fallbacks.
- Do not bloat or mutate unrelated view files.

---

## 3. Approaches Considered

### Approach A: Dual-Module Upgrade with Seamless Facade (Selected)
- **Architecture:** 
  1. Install `maplibre-gl` and `@types/maplibre-gl`.
  2. Implement `src/components/MapLibreRouteMap.tsx` using MapLibre GL JS with OpenFreeMap Liberty style, WebGL GeoJSON layers for route casing and core lines, and custom DOM markers for waypoints and live tracking.
  3. Update `src/components/LeafletRouteMap.tsx` as a clean facade that forwards all props directly to `MapLibreRouteMap.tsx`.
- **Pros:** 100% backward-compatible. Caller views (`SearchView`, `PublishRideView`, `RidePassModal`, `RouteCorridorMap`) do not need risky structural edits. All tests pass out of the box. Zero risk of breaking booking or search state.
- **Trade-offs:** Keeps `LeafletRouteMap.tsx` as an adapter file for backward compatibility.

### Approach B: Direct In-File Overwrite of `LeafletRouteMap.tsx`
- **Architecture:** Directly replace Leaflet code inside `LeafletRouteMap.tsx` with MapLibre GL JS code without creating a new file.
- **Pros:** Single file modified.
- **Trade-offs:** File name contains "Leaflet" despite using MapLibre.

### Approach C: Global Rename Across All 4 Views
- **Architecture:** Create `MapLibreRouteMap.tsx`, uninstall Leaflet, delete `LeafletRouteMap.tsx`, and update all import statements across `SearchView.tsx`, `PublishRideView.tsx`, `RidePassModal.tsx`, `RouteCorridorMap.tsx`, and test files.
- **Pros:** Completely purges legacy name.
- **Trade-offs:** Touches four large (>500 lines) production view files, creating unnecessary risk of git merge conflicts or subtle prop regressions.

**Selected Approach:** **Approach A** (with clean re-export and shared interface).

---

## 4. Technical Specification

### 4.1 Dependency Addition
- `maplibre-gl`: `^5.0.0` (or latest stable compatible with React 19).
- CSS: `import 'maplibre-gl/dist/maplibre-gl.css'`.

### 4.2 Map Initialization & Options
- **Style URL:** `https://tiles.openfreemap.org/styles/liberty`
- **Center:** `[80.6337, 7.2906]` (Sri Lanka center: Kandy / Central Province; Note: MapLibre uses `[lng, lat]` order).
- **Default Zoom:** `8`
- **Navigation Controls:** Standard 2D navigation:
  - `dragRotate: false` (locked top-down 2D for clean ride overview).
  - `touchPitch: false`
  - `pitchWithRotate: false`
- **Attribution:** Custom compact attribution showing `© OpenStreetMap · © OpenFreeMap` without intrusive flags or warnings.

### 4.3 Route Geometry Layer (WebGL)
- OSRM / Geodesic polyline coordinates from `fetchRoutePolylineWithFallback(waypoints)` (given as `[lat, lng][]`) converted to GeoJSON coordinates `[lng, lat][]`.
- **Casing Layer (`yamo-route-casing`):**
  - Type: `line`
  - Paint: `line-color: #064e3b`, `line-width: 8`, `line-opacity: 0.28`, `line-blur: 1`.
  - Layout: `line-cap: round`, `line-join: round`.
- **Core Route Layer (`yamo-route-core`):**
  - Type: `line`
  - Paint: `line-color: #059669`, `line-width: 5`, `line-opacity: 0.96`.
  - DashArray: `[2, 2]` if `source === 'fallback'`, solid otherwise.
  - Layout: `line-cap: round`, `line-join: round`.

### 4.4 Custom DOM Markers
- MapLibre `new maplibregl.Marker({ element, anchor: 'center' })`:
  - **Pickup Pill:** `#047857` pill tag with `PICKUP`, green dot, stop name, and departure time.
  - **Drop-off Pill:** `#0f172a` pill tag with `DROP-OFF`, amber dot, stop name, and departure time.
  - **Intermediate Stops:** `#ffffff` circle with `#047857` border and sequence index (`1`, `2`, `3`).
  - **Live Participants:** Driver car emoji 🚗 and Rider emoji 🧍‍♂️ with status chips.
- Interactive popups attached via `maplibregl.Popup({ offset: 12, closeButton: false })` displaying stop landmark and km distance.

### 4.5 Bounds Fitting
- Using `map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 42, maxZoom: 13, duration: 800 })`.

### 4.6 Cleanup & Resize
- `ResizeObserver` on container to call `map.resize()` smoothly when switching between tabs or resizing window/orientation.
- `map.remove()` invoked in `useEffect` cleanup.

---

## 5. Verification Plan

1. **Build & Type Check:**
   - Run `npm run build` (`tsc --noEmit && vite build`).
2. **Unit Tests:**
   - Run `npm test` to verify all 95+ existing tests pass.
3. **Route & Map Tile Inspection:**
   - Test key Sri Lankan routes (Colombo -> Galle, Colombo -> Kandy, Kandy -> Jaffna).
   - Verify network tab contains zero requests to `cartocdn.com` and all vector tile requests flow to `tiles.openfreemap.org`.
4. **Android APK Sync:**
   - Run `npm run cap:sync` to push vector map build to Android project.
