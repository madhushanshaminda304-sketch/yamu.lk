import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeProximitySummary,
  interpolatePositionAlongPolyline,
  buildMultiStopGoogleMapsUrl,
  buildWazeNavigationUrl,
  DRIVER_QUICK_STATUS_CHIPS,
  PASSENGER_QUICK_STATUS_CHIPS,
  createLocalLiveRoomBus,
  type LiveParticipantLocation,
} from '../src/domain/liveTracking.ts';

test('liveTracking domain helpers & real-time driver-passenger motion', async (t) => {
  await t.test('computeProximitySummary calculates distance, ETA, and <500m arriving alert', () => {
    // 1. Far apart (~2.2 km in Colombo)
    const far = computeProximitySummary(
      { lat: 6.9271, lng: 79.8612 }, // Fort
      { lat: 6.9100, lng: 79.8612 }  // Kollupitiya
    );
    assert.ok(far.distanceKm > 1.5 && far.distanceKm < 2.2);
    assert.equal(far.isArrivingSoon, false);
    assert.ok(far.etaMinutes >= 2);
    assert.ok(far.walkingMinutes >= 15);

    // 2. Within 300 meters (< 0.5 km threshold)
    const arriving = computeProximitySummary(
      { lat: 6.9271, lng: 79.8612 },
      { lat: 6.9290, lng: 79.8612 } // ~210m away
    );
    assert.ok(arriving.distanceKm < 0.5);
    assert.equal(arriving.isArrivingSoon, true);
    assert.equal(arriving.distanceMeters, Math.round(arriving.distanceKm * 1000));
    assert.equal(arriving.etaMinutes, 1);
  });

  await t.test('interpolatePositionAlongPolyline smoothly interpolates 0..1 progress along route', () => {
    const polyline: Array<[number, number]> = [
      [6.9271, 79.8612],
      [6.8412, 79.9684],
      [6.0535, 80.2210],
    ];

    const start = interpolatePositionAlongPolyline(polyline, 0);
    assert.deepEqual(start, [6.9271, 79.8612]);

    const end = interpolatePositionAlongPolyline(polyline, 1);
    assert.deepEqual(end, [6.0535, 80.2210]);

    const mid = interpolatePositionAlongPolyline(polyline, 0.5);
    assert.deepEqual(mid, [6.8412, 79.9684]);

    const quarter = interpolatePositionAlongPolyline(polyline, 0.25);
    assert.ok(quarter[0] < 6.9271 && quarter[0] > 6.8412);
    assert.ok(quarter[1] > 79.8612 && quarter[1] < 79.9684);
  });

  await t.test('buildMultiStopGoogleMapsUrl and buildWazeNavigationUrl format turn-by-turn URLs', () => {
    const gmaps = buildMultiStopGoogleMapsUrl([
      { lat: 6.9271, lng: 79.8612 },
      { lat: 6.8412, lng: 79.9684 },
      { lat: 6.0535, lng: 80.2210 },
    ]);
    assert.ok(gmaps.includes('origin=6.9271,79.8612'));
    assert.ok(gmaps.includes('destination=6.0535,80.221'));
    assert.ok(gmaps.includes('waypoints=6.8412,79.9684'));

    const waze = buildWazeNavigationUrl({ lat: 6.0535, lng: 80.2210 });
    assert.equal(waze, 'https://waze.com/ul?ll=6.0535,80.221&navigate=yes');
  });

  await t.test('quick status chips exist for both driver and passenger roles', () => {
    assert.ok(DRIVER_QUICK_STATUS_CHIPS.length >= 3);
    assert.ok(PASSENGER_QUICK_STATUS_CHIPS.length >= 3);
  });

  await t.test('createLocalLiveRoomBus broadcasts live locations between driver and passenger listeners', () => {
    const bus = createLocalLiveRoomBus();
    const received: LiveParticipantLocation[] = [];

    const unsub = bus.subscribe('ride-101', (payload) => {
      received.push(payload);
    });

    const driverPing: LiveParticipantLocation = {
      rideId: 'ride-101',
      userId: 'u-driver',
      userName: 'Kasun Perera',
      role: 'driver',
      lat: 6.9200,
      lng: 79.8650,
      statusText: '🚗 Leaving now',
      updatedAt: Date.now(),
    };

    bus.publish(driverPing);
    assert.equal(received.length, 1);
    assert.equal(received[0].userName, 'Kasun Perera');
    assert.equal(received[0].statusText, '🚗 Leaving now');

    unsub();
    bus.publish(driverPing);
    assert.equal(received.length, 1);
  });
});
