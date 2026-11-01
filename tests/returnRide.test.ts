import test from 'node:test';
import assert from 'node:assert/strict';
import { createMarketplaceStore } from '../src/state/store.ts';

test('return trip publishing & luggage capacity', async (t) => {
  await t.test('publishes single ride with luggage capacity', () => {
    const store = createMarketplaceStore();
    const published = store.publishRide({
      originHubId: 'colombo',
      destinationHubId: 'galle',
      corridorId: 'e01-southern-expressway',
      date: '2026-11-10',
      departureTime: '08:00',
      pickupLandmark: 'Fort Railway Station Main Entrance',
      dropoffLandmark: 'Pinnaduwa E01 Interchange',
      selectedStopoverHubIds: ['makumbura', 'kurundugahahetekma'],
      boostEnabled: true,
      seats: 3,
      priceLkr: 2500,
      tollPolicy: 'included',
      approvalMode: 'instant',
      vehicleMakeModel: 'Toyota Prius - White',
      vehicleCategory: 'car',
      acGuaranteed: true,
      comfort: {
        chattiness: 'bla',
        maxTwoInBack: true,
        luggage: 'large',
        music: 'yes',
        pets: 'no',
        smoking: 'no',
        womenOnly: false,
      },
      luggageCapacity: 'large',
      notes: 'Morning express commute',
    });

    assert.ok(published.id);
    const rides = store.getState().rides;
    const found = rides.find((r) => r.id === published.id);
    assert.ok(found);
    assert.equal(found?.luggageCapacity, 'large');
  });

  await t.test('publishes outbound and return trip atomically when returnTripEnabled is true', () => {
    const store = createMarketplaceStore();
    const published = store.publishRide({
      originHubId: 'colombo',
      destinationHubId: 'galle',
      corridorId: 'e01-southern-expressway',
      date: '2026-11-10',
      departureTime: '08:00',
      pickupLandmark: 'Fort Railway Station Main Entrance',
      dropoffLandmark: 'Pinnaduwa E01 Interchange',
      selectedStopoverHubIds: ['makumbura'],
      boostEnabled: true,
      seats: 3,
      priceLkr: 2500,
      tollPolicy: 'included',
      approvalMode: 'instant',
      vehicleMakeModel: 'Toyota Prius - White',
      vehicleCategory: 'car',
      acGuaranteed: true,
      comfort: {
        chattiness: 'bla',
        maxTwoInBack: true,
        luggage: 'medium',
        music: 'yes',
        pets: 'no',
        smoking: 'no',
        womenOnly: false,
      },
      luggageCapacity: 'medium',
      returnTripEnabled: true,
      returnDate: '2026-11-12',
      returnTime: '17:00',
      notes: 'Weekend trip',
    });

    assert.ok(published.id);
    assert.ok(published.returnRideId);

    const rides = store.getState().rides;
    const outbound = rides.find((r) => r.id === published.id);
    const returnRide = rides.find((r) => r.id === published.returnRideId);

    assert.ok(outbound);
    assert.ok(returnRide);

    assert.equal(outbound?.originHubId, 'colombo');
    assert.equal(outbound?.destinationHubId, 'galle');
    assert.equal(returnRide?.originHubId, 'galle');
    assert.equal(returnRide?.destinationHubId, 'colombo');

    assert.equal(returnRide?.departureDate, '2026-11-12');
    assert.equal(returnRide?.departureAt.includes('17:00'), true);

    // Landmarks swapped
    assert.equal(returnRide?.stops[0].pickupLandmark, 'Pinnaduwa E01 Interchange');
    assert.equal(
      returnRide?.stops[returnRide.stops.length - 1].pickupLandmark,
      'Fort Railway Station Main Entrance'
    );

    assert.equal(returnRide?.fullPriceLkr, 2500);
    assert.equal(returnRide?.corridorId, 'e01-southern-expressway');
    assert.equal(returnRide?.luggageCapacity, 'medium');
  });

  await t.test('rejects return trip scheduled before outbound arrival + 30m', () => {
    const store = createMarketplaceStore();
    assert.throws(
      () => {
        store.publishRide({
          originHubId: 'colombo',
          destinationHubId: 'galle',
          corridorId: 'e01-southern-expressway',
          date: '2026-11-10',
          departureTime: '08:00', // Arrives at 09:35
          pickupLandmark: 'Fort Station',
          dropoffLandmark: 'Galle Fort',
          selectedStopoverHubIds: [],
          boostEnabled: true,
          seats: 3,
          priceLkr: 2500,
          tollPolicy: 'included',
          approvalMode: 'instant',
          vehicleMakeModel: 'Toyota Aqua',
          vehicleCategory: 'car',
          acGuaranteed: true,
          comfort: {
            chattiness: 'bla',
            maxTwoInBack: true,
            luggage: 'medium',
            music: 'yes',
            pets: 'no',
            smoking: 'no',
            womenOnly: false,
          },
          returnTripEnabled: true,
          returnDate: '2026-11-10',
          returnTime: '09:00', // Impossible return departure before arrival
          notes: '',
        });
      },
      /30 minutes/
    );
  });
});
