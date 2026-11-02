# Free Interactive Map Integration for Yamo (Sri Lanka): Research Report

*Generated: 2026-11-03 | Sources: Primary Codebase Audit + Official Mapping Specs (OpenFreeMap, MapLibre, Leaflet, OSRM, OpenStreetMap) | Confidence: High*

## Executive Summary

Yamo (`yamo.lk`) already possesses the full geospatial data foundation required for interactive mapping—every Sri Lankan city and expressway interchange in [`src/domain/corridors.ts`](../../../src/domain/corridors.ts) includes verified `lat` and `lng` WGS84 coordinates, Haversine GPS matching in [`src/native/geolocation.ts`](../../../src/native/geolocation.ts), a horizontal route progress diagram in [`src/components/RouteCorridorMap.tsx`](../../../src/components/RouteCorridorMap.tsx), and external Google Maps deep links in [`src/domain/sharing.ts`](../../../src/domain/sharing.ts). However, the app currently displays a **1D linear stop timeline** rather than a **2D geographic map**. To add a real interactive map at **$0 cost, with zero API keys and no credit card requirement**, the highest-value options are: (1) **Leaflet + OpenStreetMap Standard Tiles + OSRM Route Polylines**, (2) **MapLibre GL JS + OpenFreeMap Vector Tiles**, or (3) **Interactive 2D Sri Lanka SVG Map + Toggleable Leaflet Street Map**.

---

## 1. Audit: What Map Features Yamo Already Has

| Existing Feature | File Location | What It Currently Does | Limitation |
|---|---|---|---|
| **Geospatial Hub Coordinates** | [`src/domain/corridors.ts`](../../../src/domain/corridors.ts) | Stores exact `lat` / `lng` for all 26+ Sri Lankan hubs and expressway exits (Colombo, Makumbura MMC, Galle, Kandy, Kurunegala, Jaffna, etc.). | Only used for distance math, not plotted on a visual 2D map canvas. |
| **Corridor Timeline Bar** | [`src/components/RouteCorridorMap.tsx`](../../../src/components/RouteCorridorMap.tsx) | Renders a horizontal progress bar showing highway code (`E01`, `E04`, `A1`), stop names, and `km` markers in `RideDetailView.tsx`. | It is a 1D step bar, not a geographic map showing Sri Lanka's coastline or road path. |
| **1-Tap GPS Nearest Hub** | [`src/native/geolocation.ts`](../../../src/native/geolocation.ts) | Uses Capacitor/Browser GPS + Haversine distance to snap a commuter to the closest Sri Lankan hub. | Does not show a "You Are Here" blue dot on a visual map. |
| **Google Maps Pin Handoff** | [`src/domain/sharing.ts`](../../../src/domain/sharing.ts) | `buildGoogleMapsLandmarkUrl()` opens `https://www.google.com/maps/search/?api=1&query=lat,lng` in a new tab/app from `RidePassModal.tsx`. | Requires leaving Yamo to view the pickup spot on a map. |

---

## 2. Evaluation of 100% Free Map Options (No API Key / No Credit Card)

### Option A: Leaflet + OpenStreetMap Tiles + OSRM Routing (Recommended Best Balance)
- **How it works**: Uses `leaflet` (~42 kB gzipped) with standard OpenStreetMap tiles (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`) and queries the free OSRM routing engine (`https://router.project-osrm.org/route/v1/driving/...`) to draw the exact highway curve along E01/E04/A1 between the ride's stops, falling back to a clean polyline connecting the hub coordinates if offline.
- **Cost & Auth**: **100% Free**, **No API Key**, **No Credit Card**.
- **Sri Lanka Coverage**: OpenStreetMap has complete road and expressway geometry for Sri Lanka (Southern Expressway E01, Outer Circular E02, Airport E03, Central E04, A1–A9 highways) including Sinhala/Tamil/English place labels.
- **Pros**:
  - Interactive pan/zoom street-level view of pickup landmarks (e.g., Makumbura MMC, Kandy City Centre, Galle Fort).
  - Custom Ceylon Emerald (`#047857`) route polylines and interactive stopover pins with click popups showing departure time and landmark name.
  - Works inside `RouteCorridorMap.tsx` as a toggle: **"🗺️ Live Map"** vs **"📏 Stop Timeline"**.

### Option B: MapLibre GL JS + OpenFreeMap Vector Tiles
- **How it works**: Uses `maplibre-gl` with OpenFreeMap (`https://tiles.openfreemap.org/styles/liberty` or `positron`).
- **Cost & Auth**: **100% Free**, **No API Key**, **No Limits** ([OpenFreeMap](https://openfreemap.org/)).
- **Trade-off**: `maplibre-gl` adds ~210 kB gzipped to the JS bundle (5x heavier than Leaflet), which is noticeable on 3G/4G commuter mobile connections in Sri Lanka.

### Option C: Zero-Dependency Interactive 2D Sri Lanka SVG + OSM Embed Fallback
- **How it works**: Projects the `lat`/`lng` coordinates of Sri Lanka (`lat: 5.9°–9.9° N`, `lng: 79.6°–81.9° E`) onto an accurate Sri Lanka island SVG silhouette with plotted highway corridors, plus an optional 1-click embedded OpenStreetMap/Google Maps iframe for street-level landmark inspection.
- **Cost & Auth**: **100% Free**, **0 kB external library**, works **100% offline** in tunnels/expressways.

---

## 3. Recommended Upgrade Architecture for Yamo

Upgrade [`src/components/RouteCorridorMap.tsx`](../../../src/components/RouteCorridorMap.tsx) (and optionally `PublishRideView.tsx` / `RidePassModal.tsx`) with a **Dual-Mode Interactive Map**:

1. **Interactive Leaflet Street & Highway Map**:
   - Plots all ride stops (`ride.stops`) using their exact `lat`/`lng` from `corridors.ts`.
   - Highlights **Your Pickup** (Emerald green pin) and **Your Drop-off** (Amber gold pin), plus intermediate Boost stopovers.
   - Fetches real road geometry from OSRM (`router.project-osrm.org`) to draw the actual E01/E04/A1 highway path, with automatic instant fallback to hub-to-hub polylines when offline.
   - Lazy-loaded (`React.lazy` or dynamic import) so it does not bloat the initial main bundle chunk.
2. **Keep the Existing Corridor Timeline Bar Beneath/Toggleable**:
   - Commuters get both the interactive zoomable map and the quick-glance stopover timeline (`0km → 116km`).
3. **Pickup Landmark Map Preview in `RidePassModal`**:
   - Passengers can view their exact pickup pin right inside the Digital Boarding Pass or tap "Open in Google Maps" for turn-by-turn walking/driving directions.

---

## Sources
1. [OpenFreeMap Official Documentation](https://openfreemap.org/) — Free vector tile hosting (`tiles.openfreemap.org`) requiring no API key or registration.
2. [Leaflet Official Documentation](https://leafletjs.com/reference.html) — Lightweight open-source JavaScript library for mobile-friendly interactive maps.
3. [Project OSRM HTTP API Specification](http://project-osrm.org/docs/v5.24.0/api/) — Public routing API (`router.project-osrm.org/route/v1/driving/`) returning GeoJSON road geometry.
4. [CARTO Basemaps API Key Policy](https://carto.com/basemaps/apikey/) — Confirms CARTO raster tiles now require an API key parameter, making OpenStreetMap standard tiles or OpenFreeMap the superior zero-key choice.
