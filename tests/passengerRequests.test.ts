import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  SEEDED_PASSENGER_REQUESTS,
  filterPassengerRequests,
  createPassengerRequest,
  COMMUTE_CORRIDORS,
  calculateWeekdayCommuteSavings,
  type PassengerRideRequest,
} from '../src/domain/passengerRequests.ts';
import { createMarketplaceStore } from '../src/state/store.ts';

describe('Passenger Ride Requests & Weekday Commute Domain', () => {
  test('SEEDED_PASSENGER_REQUESTS contains realistic verified Sri Lankan commuter requests', () => {
    assert.ok(SEEDED_PASSENGER_REQUESTS.length >= 4);

    for (const req of SEEDED_PASSENGER_REQUESTS) {
      assert.ok(req.id.startsWith('req-'));
      assert.ok(req.passengerName.length > 2);
      assert.ok(req.originHubId.length > 0);
      assert.ok(req.destinationHubId.length > 0);
      assert.ok(req.targetContributionLkr > 0);
      assert.ok(req.seatsNeeded >= 1 && req.seatsNeeded <= 4);
      assert.ok(req.settlementPreference === 'lankaqr' || req.settlementPreference === 'cash_lkr');
      assert.ok(req.status === 'open');
    }
  });

  test('filterPassengerRequests filters accurately and falls back when no exact match', () => {
    const makumburaGalle = filterPassengerRequests(
      SEEDED_PASSENGER_REQUESTS,
      'makumbura',
      'galle'
    );
    assert.ok(makumburaGalle.length >= 1);
    assert.equal(makumburaGalle[0].originHubId, 'makumbura');
    assert.equal(makumburaGalle[0].destinationHubId, 'galle');

    // Non-existent route returns empty array when strict
    const emptyMatch = filterPassengerRequests(
      SEEDED_PASSENGER_REQUESTS,
      'jaffna',
      'hambantota'
    );
    assert.equal(emptyMatch.length, 0);
  });

  test('createPassengerRequest generates unique ID, avatarInitials, and open status', () => {
    const newReq = createPassengerRequest({
      passengerName: 'Nimesh Bandara',
      passengerPhone: '+94771234567',
      isNicVerified: true,
      originHubId: 'colombo',
      originName: 'Colombo Fort',
      destinationHubId: 'galle',
      destinationName: 'Galle Interchange',
      date: '2026-11-06',
      time: '18:00',
      seatsNeeded: 1,
      targetContributionLkr: 1750,
      settlementPreference: 'lankaqr',
      pickupLandmark: 'Bambalapitiya Junction',
    });

    assert.ok(newReq.id.startsWith('req-'));
    assert.equal(newReq.passengerName, 'Nimesh Bandara');
    assert.equal(newReq.avatarInitials, 'NB');
    assert.equal(newReq.status, 'open');
    assert.ok(newReq.createdAt.length > 0);
  });

  test('Store manages passenger request lifecycle (add and offer seat)', () => {
    const store = createMarketplaceStore();
    const initialCount = store.getState().passengerRequests.length;
    assert.ok(initialCount >= 4);

    const added = store.postPassengerRequest({
      passengerName: 'Kavindi Senarath',
      passengerPhone: '+94711122334',
      isNicVerified: true,
      originHubId: 'makumbura',
      originName: 'Makumbura MMC',
      destinationHubId: 'matara',
      destinationName: 'Matara Godagama',
      date: '2026-11-07',
      time: '17:00',
      seatsNeeded: 1,
      targetContributionLkr: 2200,
      settlementPreference: 'lankaqr',
      pickupLandmark: 'MMC Platform 3',
    });

    assert.equal(store.getState().passengerRequests.length, initialCount + 1);
    assert.equal(store.getState().passengerRequests[0].id, added.id);

    // Offer seat marks request matched
    store.offerSeatToPassengerRequest(added.id);
    const updated = store.getState().passengerRequests.find((r) => r.id === added.id);
    assert.equal(updated?.status, 'matched');
  });

  test('COMMUTE_CORRIDORS defines high-congestion Sri Lankan weekday corridors with 5-day savings', () => {
    assert.ok(COMMUTE_CORRIDORS.length >= 4);
    const malabe = COMMUTE_CORRIDORS.find((c) => c.id === 'malabe-colombo');
    assert.ok(malabe);
    assert.equal(malabe.isTollFree, true);

    const negombo = COMMUTE_CORRIDORS.find((c) => c.id === 'negombo-colombo-e03');
    assert.ok(negombo);
    assert.equal(negombo.tollOneWayLkr, 350);

    const savings = calculateWeekdayCommuteSavings(negombo);
    assert.ok(savings.weeklySoloCostLkr > 0);
    assert.ok(savings.weeklyCarpoolShareLkr > 0);
    assert.ok(savings.weeklySavingsLkr > 0);
    assert.ok(savings.savingsPercent >= 50);
  });
});
