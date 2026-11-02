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
