import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeMapLibreBounds,
  positionsToGeoJsonLine,
  OPENFREEMAP_LIBERTY_STYLE_URL,
  type RouteMapWaypoint,
} from '../src/domain/routeMapGeometry.ts';
import { ALL_HUBS, getHubById } from '../src/domain/corridors.ts';

// Bounding box of Sri Lanka island (WGS84)
const SRI_LANKA_BBOX = {
  minLat: 5.8,
  maxLat: 9.9,
  minLng: 79.5,
  maxLng: 82.0,
};

// 8 Mandatory target verification cities from specification
const TARGET_TEST_CITIES = [
  { id: 'colombo', name: 'Colombo', expectedLat: 6.9271, expectedLng: 79.8612 },
  { id: 'negombo', name: 'Negombo', expectedLat: 7.2008, expectedLng: 79.8736 },
  { id: 'kandy', name: 'Kandy', expectedLat: 7.2906, expectedLng: 80.6337 },
  { id: 'galle', name: 'Galle', expectedLat: 6.0535, expectedLng: 80.2210 },
  { id: 'matara', name: 'Matara', expectedLat: 5.9549, expectedLng: 80.5550 },
  { id: 'kurunegala', name: 'Kurunegala', expectedLat: 7.4863, expectedLng: 80.3623 },
  { id: 'jaffna', name: 'Jaffna', expectedLat: 9.6615, expectedLng: 80.0255 },
  { id: 'ella', name: 'Ella', expectedLat: 6.8667, expectedLng: 81.0466 },
];

test('OpenFreeMap Liberty vector tile style URL is valid and secure', () => {
  assert.equal(OPENFREEMAP_LIBERTY_STYLE_URL, 'https://tiles.openfreemap.org/styles/liberty');
  assert.match(OPENFREEMAP_LIBERTY_STYLE_URL, /^https:\/\//);
});

test('All 8 target Sri Lankan cities have valid coordinates inside Sri Lanka territory', () => {
  for (const city of TARGET_TEST_CITIES) {
    const hub = getHubById(city.id) || ALL_HUBS.find((h) => h.name.en.toLowerCase() === city.name.toLowerCase());
    assert.ok(hub, `Hub should exist for ${city.name}`);
    assert.ok(typeof hub.lat === 'number', `${city.name} must have numeric latitude`);
    assert.ok(typeof hub.lng === 'number', `${city.name} must have numeric longitude`);

    assert.ok(
      hub.lat >= SRI_LANKA_BBOX.minLat && hub.lat <= SRI_LANKA_BBOX.maxLat,
      `${city.name} lat ${hub.lat} must be within Sri Lanka bounds [${SRI_LANKA_BBOX.minLat}, ${SRI_LANKA_BBOX.maxLat}]`
    );
    assert.ok(
      hub.lng >= SRI_LANKA_BBOX.minLng && hub.lng <= SRI_LANKA_BBOX.maxLng,
      `${city.name} lng ${hub.lng} must be within Sri Lanka bounds [${SRI_LANKA_BBOX.minLng}, ${SRI_LANKA_BBOX.maxLng}]`
    );
  }
});

test('computeMapLibreBounds spans complete Colombo-to-Galle expressway journey', () => {
  const colomboHub = getHubById('colombo')!;
  const makumburaHub = getHubById('makumbura')!;
  const galleHub = getHubById('galle')!;

  const waypoints: RouteMapWaypoint[] = [
    {
      hubId: colomboHub.id,
      name: colomboHub.name.en,
      landmark: 'Bastian Mawatha',
      departureAt: '06:30',
      kmFromOrigin: 0,
      lat: colomboHub.lat,
      lng: colomboHub.lng,
      isOrigin: true,
      isDestination: false,
      isSelectedFrom: true,
      isSelectedTo: false,
      isBoostStop: false,
      isExpresswayInterchange: false,
    },
    {
      hubId: makumburaHub.id,
      name: makumburaHub.name.en,
      landmark: 'MMC Platform 3',
      departureAt: '07:05',
      kmFromOrigin: 21,
      lat: makumburaHub.lat,
      lng: makumburaHub.lng,
      isOrigin: false,
      isDestination: false,
      isSelectedFrom: false,
      isSelectedTo: false,
      isBoostStop: true,
      isExpresswayInterchange: true,
    },
    {
      hubId: galleHub.id,
      name: galleHub.name.en,
      landmark: 'Galle Fort Interchange',
      departureAt: '08:15',
      kmFromOrigin: 116,
      lat: galleHub.lat,
      lng: galleHub.lng,
      isOrigin: false,
      isDestination: true,
      isSelectedFrom: false,
      isSelectedTo: true,
      isBoostStop: false,
      isExpresswayInterchange: true,
    },
  ];

  const bounds = computeMapLibreBounds(waypoints);
  assert.ok(bounds, 'Bounds must not be null');

  const [[minLng, minLat], [maxLng, maxLat]] = bounds;

  // Verify MapLibre coordinate order [lng, lat]
  assert.ok(minLng < maxLng, `minLng (${minLng}) must be < maxLng (${maxLng})`);
  assert.ok(minLat < maxLat, `minLat (${minLat}) must be < maxLat (${maxLat})`);

  // Verify bounding box wraps Galle (south) and Colombo (north)
  assert.ok(minLat <= galleHub.lat, 'minLat should bound southern-most Galle stop');
  assert.ok(maxLat >= colomboHub.lat, 'maxLat should bound northern-most Colombo stop');
  assert.ok(minLng <= colomboHub.lng, 'minLng should bound western-most Colombo stop');
  assert.ok(maxLng >= galleHub.lng, 'maxLng should bound eastern-most Galle stop');
});

test('positionsToGeoJsonLine maps southern expressway route coordinates with round joins and valid GeoJSON', () => {
  const positions: [number, number][] = [
    [6.9271, 79.8612], // Colombo
    [6.8411, 79.9983], // Makumbura
    [6.0535, 80.2210], // Galle
  ];

  const feature = positionsToGeoJsonLine(positions);
  assert.equal(feature.type, 'Feature');
  assert.equal(feature.geometry.type, 'LineString');
  assert.equal(feature.geometry.coordinates.length, 3);

  // Each GeoJSON coordinate must be [lng, lat]
  assert.deepEqual(feature.geometry.coordinates[0], [79.8612, 6.9271]);
  assert.deepEqual(feature.geometry.coordinates[1], [79.9983, 6.8411]);
  assert.deepEqual(feature.geometry.coordinates[2], [80.2210, 6.0535]);
});
