import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractRouteMapWaypoints,
  computeMapBounds,
  buildOsrmDrivingUrl,
  fetchRoutePolylineWithFallback,
} from '../src/domain/routeMapGeometry.ts';
import type { RideStop } from '../src/domain/matching.ts';

test('routeMapGeometry domain helpers', async (t) => {
  const sampleStops: RideStop[] = [
    {
      hubId: 'colombo',
      stopIndex: 0,
      arrivalAt: '2026-11-05T07:00:00+05:30',
      departureAt: '2026-11-05T07:00:00+05:30',
      kmFromOrigin: 0,
      priceFromOriginLkr: 0,
      pickupLandmark: 'Fort Railway Station',
    },
    {
      hubId: 'makumbura',
      stopIndex: 1,
      arrivalAt: '2026-11-05T07:25:00+05:30',
      departureAt: '2026-11-05T07:29:00+05:30',
      kmFromOrigin: 18,
      priceFromOriginLkr: 400,
      pickupLandmark: 'Makumbura MMC E01 Bay',
      isBoostStop: true,
    },
    {
      hubId: 'galle',
      stopIndex: 2,
      arrivalAt: '2026-11-05T08:40:00+05:30',
      departureAt: '2026-11-05T08:40:00+05:30',
      kmFromOrigin: 116,
      priceFromOriginLkr: 2400,
      pickupLandmark: 'Pinnaduwa E01 Interchange',
    },
  ];

  await t.test('extractRouteMapWaypoints maps RideStops to verified Sri Lankan coordinates', () => {
    const waypoints = extractRouteMapWaypoints(sampleStops, 'makumbura', 'galle', 'en');
    assert.equal(waypoints.length, 3);

    assert.equal(waypoints[0].hubId, 'colombo');
    assert.ok(Math.abs(waypoints[0].lat - 6.9271) < 0.01);
    assert.ok(Math.abs(waypoints[0].lng - 79.8612) < 0.01);
    assert.equal(waypoints[0].isOrigin, true);
    assert.equal(waypoints[0].isSelectedFrom, false);

    assert.equal(waypoints[1].hubId, 'makumbura');
    assert.equal(waypoints[1].isSelectedFrom, true);
    assert.equal(waypoints[1].isBoostStop, true);

    assert.equal(waypoints[2].hubId, 'galle');
    assert.equal(waypoints[2].isDestination, true);
    assert.equal(waypoints[2].isSelectedTo, true);
  });

  await t.test('computeMapBounds calculates valid SW and NE bounding coordinates', () => {
    const waypoints = extractRouteMapWaypoints(sampleStops, 'colombo', 'galle', 'en');
    const bounds = computeMapBounds(waypoints);
    assert.ok(bounds);
    const [[south, west], [north, east]] = bounds;
    assert.ok(south <= 6.0535);
    assert.ok(north >= 6.9271);
    assert.ok(west <= 79.8612);
    assert.ok(east >= 80.221);
  });

  await t.test('buildOsrmDrivingUrl formats coordinates as lng,lat semicolon-separated string', () => {
    const waypoints = extractRouteMapWaypoints(sampleStops, 'colombo', 'galle', 'en');
    const url = buildOsrmDrivingUrl(waypoints);
    assert.ok(url.startsWith('https://router.project-osrm.org/route/v1/driving/'));
    assert.ok(url.includes('79.8612,6.9271;79.9684,6.8412;80.221,6.0535'));
    assert.ok(url.includes('overview=full&geometries=geojson'));
  });

  await t.test('fetchRoutePolylineWithFallback returns OSRM GeoJSON lat-lngs on success and falls back to hub polyline on error', async () => {
    const waypoints = extractRouteMapWaypoints(sampleStops, 'colombo', 'galle', 'en');

    // 1. Simulated OSRM success response (GeoJSON coordinates are [lng, lat])
    const mockFetchSuccess = async () =>
      ({
        ok: true,
        json: async () => ({
          code: 'Ok',
          routes: [
            {
              geometry: {
                type: 'LineString',
                coordinates: [
                  [79.8612, 6.9271],
                  [79.95, 6.85],
                  [79.9684, 6.8412],
                  [80.1, 6.4],
                  [80.221, 6.0535],
                ],
              },
            },
          ],
        }),
      }) as Response;

    const routed = await fetchRoutePolylineWithFallback(waypoints, mockFetchSuccess);
    assert.equal(routed.source, 'osrm');
    assert.equal(routed.positions.length, 5);
    // Converted to [lat, lng] for Leaflet
    assert.deepEqual(routed.positions[0], [6.9271, 79.8612]);
    assert.deepEqual(routed.positions[4], [6.0535, 80.221]);

    // 2. Simulated network error / offline fallback
    const mockFetchFail = async () => {
      throw new Error('Network unreachable');
    };

    const fallback = await fetchRoutePolylineWithFallback(waypoints, mockFetchFail);
    assert.equal(fallback.source, 'fallback');
    assert.equal(fallback.positions.length, 3);
    assert.deepEqual(fallback.positions[0], [6.9271, 79.8612]);
    assert.deepEqual(fallback.positions[2], [6.0535, 80.221]);
  });
});
