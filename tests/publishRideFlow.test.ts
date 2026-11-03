import { describe, it } from 'node:test';
import assert from 'node:assert';
import { findRouteOptions, getHubById, HUBS } from '../src/domain/corridors.ts';
import { formatColomboTime, formatColomboDate } from '../src/domain/i18n.ts';
import { createMarketplaceStore } from '../src/state/store.ts';

describe('Publish Ride Flow & Corridor Safety', () => {
  it('findRouteOptions returns valid options for all 5 key Sri Lankan corridors', () => {
    // 1. Colombo -> Kandy
    const colomboKandy = findRouteOptions('colombo', 'kandy');
    assert.ok(colomboKandy.length > 0);
    assert.ok(colomboKandy.some((r) => r.corridorId === 'e04-central-kandy'));

    // 2. Makumbura -> Galle
    const makumburaGalle = findRouteOptions('makumbura', 'galle');
    assert.ok(makumburaGalle.length > 0);
    assert.ok(makumburaGalle.some((r) => r.corridorId === 'e01-southern-expressway'));

    // 3. Colombo -> Matara
    const colomboMatara = findRouteOptions('colombo', 'matara');
    assert.ok(colomboMatara.length > 0);
    assert.ok(colomboMatara.some((r) => r.corridorId === 'e01-southern-expressway'));

    // 4. Katunayake -> Colombo
    const katunayakeColombo = findRouteOptions('katunayake', 'colombo');
    assert.ok(katunayakeColombo.length > 0);
    assert.ok(katunayakeColombo.some((r) => r.corridorId === 'e03-airport-northern-a9'));

    // 5. Colombo -> Jaffna
    const colomboJaffna = findRouteOptions('colombo', 'jaffna');
    assert.ok(colomboJaffna.length > 0);
    assert.ok(colomboJaffna.some((r) => r.corridorId === 'e03-airport-northern-a9'));
  });

  it('findRouteOptions returns empty array when origin === destination without throwing', () => {
    assert.deepStrictEqual(findRouteOptions('colombo', 'colombo'), []);
    assert.deepStrictEqual(findRouteOptions('galle', 'galle'), []);
    assert.deepStrictEqual(findRouteOptions('', ''), []);
  });

  it('getHubById handles whitespace, casing, and unknown hubs safely', () => {
    assert.strictEqual(getHubById('colombo')?.id, 'colombo');
    assert.strictEqual(getHubById(' Colombo ')?.id, 'colombo');
    assert.strictEqual(getHubById('MAKUMBURA')?.id, 'makumbura');
    assert.strictEqual(getHubById(''), undefined);
    assert.strictEqual(getHubById(null as any), undefined);
    assert.strictEqual(getHubById(undefined as any), undefined);
    assert.strictEqual(getHubById('non_existent_city'), undefined);
  });

  it('formatColomboTime and formatColomboDate do not crash on invalid strings', () => {
    assert.strictEqual(formatColomboTime(''), '');
    assert.strictEqual(formatColomboTime(null as any), '');
    assert.strictEqual(formatColomboTime('invalid-date-string'), '');
    assert.strictEqual(formatColomboDate(''), '');
    assert.strictEqual(formatColomboDate(null as any), '');
    assert.strictEqual(formatColomboDate('invalid-date-string'), '');
  });

  it('store.publishRide immediately places newly published ride at the top of state.rides', () => {
    const store = createMarketplaceStore();
    const initialState = store.getState();
    const initialRideCount = initialState.rides.length;

    const published = store.publishRide({
      originHubId: 'colombo',
      destinationHubId: 'kandy',
      corridorId: 'e04-central-kandy',
      date: '2026-11-05',
      departureTime: '08:00',
      returnTripEnabled: false,
      pickupLandmark: 'Fort Station Gate',
      dropoffLandmark: 'KCC Entrance',
      selectedStopoverHubIds: ['kadawatha'],
      boostEnabled: true,
      seats: 3,
      priceLkr: 2600,
      tollPolicy: 'included',
      approvalMode: 'instant',
      vehicleMakeModel: 'Honda Civic',
      vehicleCategory: 'car',
      acGuaranteed: true,
      specialRequirements: {},
      comfort: {
        chattiness: 'blabla',
        quietRide: false,
        maxTwoInBack: true,
        luggage: 'medium',
        music: 'yes',
        pets: 'no',
        smoking: 'no',
        womenOnly: false,
      },
      luggageCapacity: 'medium',
      notes: 'Prompt test ride',
    });

    const updatedState = store.getState();
    assert.strictEqual(updatedState.rides.length, initialRideCount + 1);
    assert.strictEqual(updatedState.rides[0].id, published.id);
    assert.strictEqual(updatedState.rides[0].originHubId, 'colombo');
    assert.strictEqual(updatedState.rides[0].destinationHubId, 'kandy');
  });
});
