import { getHubById } from './corridors.ts';
import type { RideStop } from './matching.ts';

export interface RouteMapWaypoint {
  hubId: string;
  name: string;
  landmark: string;
  departureAt: string;
  kmFromOrigin: number;
  lat: number;
  lng: number;
  isOrigin: boolean;
  isDestination: boolean;
  isSelectedFrom: boolean;
  isSelectedTo: boolean;
  isBoostStop: boolean;
  isExpresswayInterchange: boolean;
}

export type LatLngTuple = [number, number];

const routeGeometryCache = new Map<string, LatLngTuple[]>();

export function extractRouteMapWaypoints(
  stops: readonly RideStop[],
  selectedFromHubId?: string,
  selectedToHubId?: string,
  langKey: 'en' | 'si' | 'ta' = 'en'
): RouteMapWaypoint[] {
  const waypoints: RouteMapWaypoint[] = [];

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    const hub = getHubById(stop.hubId);
    if (!hub || typeof hub.lat !== 'number' || typeof hub.lng !== 'number') {
      continue;
    }

    waypoints.push({
      hubId: stop.hubId,
      name: hub.name[langKey] || hub.name.en || stop.hubId,
      landmark: stop.pickupLandmark || hub.landmarks[0] || hub.name.en,
      departureAt: stop.departureAt,
      kmFromOrigin: stop.kmFromOrigin,
      lat: hub.lat,
      lng: hub.lng,
      isOrigin: i === 0,
      isDestination: i === stops.length - 1,
      isSelectedFrom: Boolean(selectedFromHubId && stop.hubId === selectedFromHubId),
      isSelectedTo: Boolean(selectedToHubId && stop.hubId === selectedToHubId),
      isBoostStop: Boolean(stop.isBoostStop),
      isExpresswayInterchange: Boolean(hub.isExpresswayInterchange),
    });
  }

  return waypoints;
}

export function computeMapBounds(
  waypoints: readonly RouteMapWaypoint[]
): [LatLngTuple, LatLngTuple] | null {
  if (waypoints.length === 0) return null;

  let minLat = waypoints[0].lat;
  let maxLat = waypoints[0].lat;
  let minLng = waypoints[0].lng;
  let maxLng = waypoints[0].lng;

  for (const wp of waypoints) {
    if (wp.lat < minLat) minLat = wp.lat;
    if (wp.lat > maxLat) maxLat = wp.lat;
    if (wp.lng < minLng) minLng = wp.lng;
    if (wp.lng > maxLng) maxLng = wp.lng;
  }

  // Ensure a small minimum bounding box if only 1 point
  if (minLat === maxLat && minLng === maxLng) {
    return [
      [minLat - 0.02, minLng - 0.02],
      [maxLat + 0.02, maxLng + 0.02],
    ];
  }

  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}

export function buildOsrmDrivingUrl(waypoints: readonly RouteMapWaypoint[]): string {
  const coordPairs = waypoints.map((wp) => `${wp.lng},${wp.lat}`).join(';');
  return `https://router.project-osrm.org/route/v1/driving/${coordPairs}?overview=full&geometries=geojson`;
}

export async function fetchRoutePolylineWithFallback(
  waypoints: readonly RouteMapWaypoint[],
  fetchImpl: typeof fetch = fetch
): Promise<{ positions: LatLngTuple[]; source: 'osrm' | 'fallback' }> {
  const fallbackPositions: LatLngTuple[] = waypoints.map((wp) => [wp.lat, wp.lng]);
  if (waypoints.length < 2) {
    return { positions: fallbackPositions, source: 'fallback' };
  }

  const cacheKey = waypoints.map((wp) => wp.hubId).join('>');
  if (fetchImpl === fetch && routeGeometryCache.has(cacheKey)) {
    return { positions: routeGeometryCache.get(cacheKey)!, source: 'osrm' };
  }

  const url = buildOsrmDrivingUrl(waypoints);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetchImpl(url, { signal: controller.signal });
    if (!res.ok) {
      return { positions: fallbackPositions, source: 'fallback' };
    }

    const data = (await res.json()) as {
      code?: string;
      routes?: Array<{
        geometry?: {
          coordinates?: Array<[number, number]>;
        };
      }>;
    };

    const coords = data?.routes?.[0]?.geometry?.coordinates;
    if (Array.isArray(coords) && coords.length >= 2) {
      // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
      const positions: LatLngTuple[] = coords.map(([lng, lat]) => [lat, lng]);
      if (fetchImpl === fetch) {
        routeGeometryCache.set(cacheKey, positions);
      }
      return { positions, source: 'osrm' };
    }
  } catch {
    // Fallback to direct hub-to-hub coordinate polyline on timeout or offline
  } finally {
    clearTimeout(timer);
  }

  return { positions: fallbackPositions, source: 'fallback' };
}
