# MapLibre GL JS & OpenFreeMap Liberty Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace CARTO raster basemap integration in Yamo with MapLibre GL JS and OpenFreeMap Liberty vector tiles, delivering a high-detail Sri Lankan road and navigation map while preserving all existing booking flows, UI dimensions, green route styling, and HTML markers.

**Architecture:** Upgrade the map rendering engine to `maplibre-gl` with OpenFreeMap Liberty style vector tiles (`https://tiles.openfreemap.org/styles/liberty`). Build a dedicated `MapLibreRouteMap.tsx` component featuring WebGL GeoJSON route layers and custom DOM markers, and rewire `LeafletRouteMap.tsx` as an adapter so that all existing views (`SearchView`, `PublishRideView`, `RidePassModal`, `RouteCorridorMap`) continue working with zero breaking changes.

**Tech Stack:** React 19, TypeScript, `maplibre-gl`, OpenFreeMap hosted vector tiles, Vite, Capacitor 7 (Android).

**Spec:** `docs/superpowers/specs/2026-11-03-maplibre-openfreemap-design.md`

## Global Constraints

- Basemap vector style URL must be `https://tiles.openfreemap.org/styles/liberty`.
- Zero requests to `cartocdn.com` and zero CARTO API key warnings.
- Keep Yamo's green route line (`#059669` active core with `#064e3b` casing shadow).
- Preserve existing pickup/drop-off pill markers, numbered stopover circles, and live radar pins.
- Preserve existing map container dimensions, rounded corners, and padding.
- Keep map navigation links (Google Maps & Waze) and live tracking broadcast integration.
- Do not alter Firebase, Supabase auth, booking logic, or pricing calculations.
- Maintain test coverage (all existing 95+ unit tests must continue to pass).

## Review Focus

1. Coordinate ordering mismatch (`[lat, lng]` in Leaflet vs `[lng, lat]` in MapLibre GeoJSON).
   *Expectation:* All waypoints and polyline points are mapped cleanly to `[lng, lat]` for MapLibre without inverted coordinates.
2. Unmounted DOM container during asynchronous style loading.
   *Expectation:* MapLibre map initialization checks container presence and cancels event listeners if unmounted before `style.load` fires.
3. Resize behavior on mobile tab switches or keyboard appearance.
   *Expectation:* `ResizeObserver` or window resize triggers `map.resize()` to avoid grey or clipped tile viewports.
4. Fallback route polyline rendering when offline or OSRM unavailable.
   *Expectation:* Dash array `[2, 2]` renders cleanly along corridor hubs without throwing WebGL errors.
5. Zero CARTO tile URLs remaining in source code or network bundle.
   *Expectation:* Codebase search confirms zero occurrences of `basemaps.cartocdn.com`.

---

### Task 1: Install `maplibre-gl` & Add MapLibre Coordinate Helpers

**Files:**
- Modify: `package.json`
- Modify: `src/domain/routeMapGeometry.ts`
- Test: `tests/maplibreHelpers.test.ts`

**Interfaces:**
- Consumes: `RouteMapWaypoint`, `LatLngTuple` from `src/domain/routeMapGeometry.ts`
- Produces: 
  - `positionsToGeoJsonLine(positions: LatLngTuple[]): GeoJSON.Feature<GeoJSON.LineString>`
  - `computeMapLibreBounds(waypoints: readonly RouteMapWaypoint[]): [[number, number], [number, number]] | null`
  - `OPENFREEMAP_LIBERTY_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'`

- [ ] **Step 1: Write the failing unit test in `tests/maplibreHelpers.test.ts`**

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  positionsToGeoJsonLine,
  computeMapLibreBounds,
  OPENFREEMAP_LIBERTY_STYLE_URL,
  type RouteMapWaypoint,
} from '../src/domain/routeMapGeometry.ts';

test('OPENFREEMAP_LIBERTY_STYLE_URL is pointing to tiles.openfreemap.org/styles/liberty', () => {
  assert.equal(OPENFREEMAP_LIBERTY_STYLE_URL, 'https://tiles.openfreemap.org/styles/liberty');
});

test('positionsToGeoJsonLine converts [lat, lng] to GeoJSON [lng, lat] LineString', () => {
  const positions: [number, number][] = [
    [6.9271, 79.8612], // Colombo
    [6.0535, 80.2210], // Galle
  ];
  const geojson = positionsToGeoJsonLine(positions);
  assert.equal(geojson.type, 'Feature');
  assert.equal(geojson.geometry.type, 'LineString');
  assert.deepEqual(geojson.geometry.coordinates, [
    [79.8612, 6.9271],
    [80.2210, 6.0535],
  ]);
});

test('computeMapLibreBounds produces [[minLng, minLat], [maxLng, maxLat]] for MapLibre fitBounds', () => {
  const waypoints: RouteMapWaypoint[] = [
    { name: 'Colombo', lat: 6.9271, lng: 79.8612, kmFromOrigin: 0, landmark: 'Fort' },
    { name: 'Galle', lat: 6.0535, lng: 80.2210, kmFromOrigin: 116, landmark: 'Galle Fort' },
  ];
  const bounds = computeMapLibreBounds(waypoints);
  assert.ok(bounds);
  assert.deepEqual(bounds, [
    [79.8612, 6.0535], // [minLng, minLat]
    [80.2210, 6.9271], // [maxLng, maxLat]
  ]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types tests/maplibreHelpers.test.ts`
Expected: FAIL (functions not defined)

- [ ] **Step 3: Install `maplibre-gl` & implement helpers in `src/domain/routeMapGeometry.ts`**

Run: `npm install maplibre-gl@^5.1.0`

In `src/domain/routeMapGeometry.ts`:
- Define `OPENFREEMAP_LIBERTY_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'`
- Implement `positionsToGeoJsonLine(positions: LatLngTuple[])` returning GeoJSON Feature of type LineString with `[lng, lat]` coordinates.
- Implement `computeMapLibreBounds(waypoints: readonly RouteMapWaypoint[])` returning `[[minLng, minLat], [maxLng, maxLat]] | null`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types tests/maplibreHelpers.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/domain/routeMapGeometry.ts tests/maplibreHelpers.test.ts
git commit -m "feat(map): install maplibre-gl and add vector coordinate helpers"
```

---

### Task 2: Build `MapLibreRouteMap.tsx` with OpenFreeMap Liberty & WebGL Route Layers

**Files:**
- Create: `src/components/MapLibreRouteMap.tsx`
- Test: Build verification (`npm run build`)

**Interfaces:**
- Consumes:
  - `RouteMapWaypoint`, `fetchRoutePolylineWithFallback`, `positionsToGeoJsonLine`, `computeMapLibreBounds`, `OPENFREEMAP_LIBERTY_STYLE_URL`
  - `joinLiveRideRoom`, `watchLiveLocation`, `triggerHaptic`, `formatColomboTime`
- Produces:
  - `export function MapLibreRouteMap(props: LeafletRouteMapProps): JSX.Element`

- [ ] **Step 1: Create `src/components/MapLibreRouteMap.tsx`**

Implement the full MapLibre component:
- Import `maplibregl` from `'maplibre-gl'` and `'maplibre-gl/dist/maplibre-gl.css'`.
- Initialize `new maplibregl.Map({ container, style: OPENFREEMAP_LIBERTY_STYLE_URL, center: [80.6337, 7.2906], zoom: 8, dragRotate: false, pitchWithRotate: false, touchPitch: false, attributionControl: false })`.
- Add compact bottom attribution: `© OpenStreetMap · © OpenFreeMap` with zero CARTO references.
- On `map.on('load')`:
  - Add GeoJSON Source `'yamo-route-source'`.
  - Add Casing Layer `'yamo-route-casing'` (line-color `#064e3b`, line-width 8, line-opacity 0.28, round caps/joins).
  - Add Core Line Layer `'yamo-route-core'` (line-color `#059669`, line-width 5, line-opacity 0.96, round caps/joins).
- Mount HTML Markers using `new maplibregl.Marker({ element, anchor: 'center' })`:
  - Pickup floating pill (emerald `#047857`)
  - Drop-off floating pill (slate `#0f172a`)
  - Numbered corridor hubs (white `#ffffff` circle with `#047857` border)
  - Live participant markers (driver 🚗 and passenger 🧍‍♂️ avatars)
- Fit bounds using `map.fitBounds(bounds, { padding: 42, maxZoom: 13, duration: 600 })`.
- Resize handling: Attach `ResizeObserver` on container div calling `map.resize()`.
- Unmount cleanup: Clean up markers, observers, and call `map.remove()`.
- Retain all top radar controls (Live GPS sharing, demo simulation, proximity badge), quick status chips, and bottom external navigation links (Google Maps / Waze).

- [ ] **Step 2: Verify TypeScript & component build**

Run: `npm run build`
Expected: Build succeeds with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/MapLibreRouteMap.tsx
git commit -m "feat(map): implement MapLibreRouteMap with OpenFreeMap Liberty vector style"
```

---

### Task 3: Rewire `LeafletRouteMap.tsx` Adapter & Remove CARTO References

**Files:**
- Modify: `src/components/LeafletRouteMap.tsx`
- Test: Unit tests & build check

**Interfaces:**
- Consumes: `MapLibreRouteMap` from `./MapLibreRouteMap.tsx`
- Produces: 
  - `export { MapLibreRouteMap as LeafletRouteMap } from './MapLibreRouteMap.tsx'`

- [ ] **Step 1: Update `src/components/LeafletRouteMap.tsx` to re-export `MapLibreRouteMap`**

Update `src/components/LeafletRouteMap.tsx` so that:
- It seamlessly forwards all props to `MapLibreRouteMap`.
- Removes the old Leaflet CARTO tile layer, Ukrainian flag bypass comment, and `leaflet/dist/leaflet.css` imports.
- Any caller importing `LeafletRouteMap` automatically gets the new MapLibre vector map.

- [ ] **Step 2: Verify zero CARTO occurrences remain in `src/`**

Run: `grep -rn "cartocdn" src/`
Expected: No matches found.

- [ ] **Step 3: Run full test suite & TypeScript check**

Run: `npm test && npm run build`
Expected: All tests pass, build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/LeafletRouteMap.tsx
git commit -m "refactor(map): rewire LeafletRouteMap to MapLibre vector map and remove CARTO"
```

---

### Task 4: Sri Lanka Multi-City Geographic Bounds Verification Test

**Files:**
- Create: `tests/sriLankaMapCities.test.ts`

**Interfaces:**
- Consumes: `computeMapLibreBounds`, `getHubById`, `SRI_LANKA_HUBS`

- [ ] **Step 1: Write `tests/sriLankaMapCities.test.ts`**

Validate geographic coordinates and bounds across all 8 specified Sri Lanka test locations:
1. Colombo (`6.9271° N, 79.8612° E`)
2. Negombo (`7.2008° N, 79.8736° E`)
3. Kandy (`7.2906° N, 80.6337° E`)
4. Galle (`6.0535° N, 80.2210° E`)
5. Matara (`5.9549° N, 80.5550° E`)
6. Kurunegala (`7.4863° N, 80.3623° E`)
7. Jaffna (`9.6615° N, 80.0255° E`)
8. Ella (`6.8667° N, 81.0466° E`)
Verify that:
- All coordinates lie strictly within Sri Lanka's bounding box (`lat 5.8 to 9.9, lng 79.5 to 81.9`).
- Colombo-to-Galle corridor route bounds correctly span min/max points.
- MapLibre bounds output `[[minLng, minLat], [maxLng, maxLat]]` has `minLng < maxLng` and `minLat < maxLat`.

- [ ] **Step 2: Run test suite**

Run: `node --test --experimental-strip-types tests/sriLankaMapCities.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tests/sriLankaMapCities.test.ts
git commit -m "test(map): add Sri Lanka multi-city coordinates and vector bounds test"
```

---

### Task 5: End-to-End Verification & Android APK Sync

**Files:**
- Check: `android/app/src/main/assets/public/`
- Test: Full build, tests, and capacitor sync

- [ ] **Step 1: Run complete test suite**

Run: `npm test`
Expected: All tests pass (97+ tests).

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: Zero type errors, bundle produced in `dist/`.

- [ ] **Step 3: Sync build to Android project**

Run: `npm run cap:sync`
Expected: Assets copied and capacitor sync successful.

- [ ] **Step 4: Verify on connected Xiaomi 13T device via USB (Optional deploy check)**

Run: `& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices`
If device present: build and install debug APK to phone.

- [ ] **Step 5: Final Git Status & Commit**

```bash
git status
git commit -m "chore(map): complete MapLibre OpenFreeMap vector map upgrade"
```
