import test from 'node:test';
import assert from 'node:assert/strict';
import {
  type Ride,
  canBookLeg,
  applyLegBooking,
  releaseLegBooking,
  searchRides,
  assignSmartTags,
} from '../src/domain/matching.ts';

const sampleSouthernRide: Ride = {
  id: 'ride-e01-matara',
  driverId: 'drv-1',
  corridorId: 'e01-southern-expressway',
  corridorCode: 'E01 / E02',
  corridorName: 'Southern Expressway (Tolls)',
  hasTolls: true,
  tollPolicy: 'included',
  estimatedTollLkr: 400,
  originHubId: 'colombo',
  destinationHubId: 'matara',
  departureDate: '2026-11-02',
  departureAt: '2026-11-02T07:00:00+05:30',
  arrivalAt: '2026-11-02T09:05:00+05:30',
  totalDistanceKm: 151,
  fullPriceLkr: 3200,
  recommendedPriceLkr: 3200,
  totalSeats: 2,
  segmentSeatsAvailable: [2, 2, 2],
  stops: [
    {
      hubId: 'colombo',
      stopIndex: 0,
      arrivalAt: '2026-11-02T07:00:00+05:30',
      departureAt: '2026-11-02T07:00:00+05:30',
      kmFromOrigin: 0,
      priceFromOriginLkr: 0,
      pickupLandmark: 'Fort Railway Station Main Entrance',
    },
    {
      hubId: 'dodangoda',
      stopIndex: 1,
      arrivalAt: '2026-11-02T07:50:00+05:30',
      departureAt: '2026-11-02T07:55:00+05:30',
      kmFromOrigin: 52,
      priceFromOriginLkr: 1100,
      pickupLandmark: 'Dodangoda Expressway Interchange',
      isBoostStop: true,
    },
    {
      hubId: 'galle',
      stopIndex: 2,
      arrivalAt: '2026-11-02T08:35:00+05:30',
      departureAt: '2026-11-02T08:40:00+05:30',
      kmFromOrigin: 116,
      priceFromOriginLkr: 2450,
      pickupLandmark: 'Pinnaduwa E01 Interchange',
    },
    {
      hubId: 'matara',
      stopIndex: 3,
      arrivalAt: '2026-11-02T09:05:00+05:30',
      departureAt: '2026-11-02T09:05:00+05:30',
      kmFromOrigin: 151,
      priceFromOriginLkr: 3200,
      pickupLandmark: 'Godagama E01 Interchange',
    },
  ],
  approvalMode: 'instant',
  boostEnabled: true,
  vehicle: {
    makeModel: 'Toyota Prius Hybrid · Pearl White',
    category: 'car',
    plateHint: 'WP CAA-48xx',
    acGuaranteed: true,
  },
  comfort: {
    chattiness: 'blabla',
    maxTwoInBack: true,
    luggage: 'medium',
    music: 'yes',
    pets: 'no',
    smoking: 'no',
    womenOnly: false,
  },
  driver: {
    id: 'drv-1',
    name: 'Kasun Perera',
    rating: 4.9,
    ratingsCount: 42,
    drivingSkillScore: 2.95,
    completedRides: 28,
    verifiedPhone: true,
    verifiedNic: true,
    verifiedLicence: true,
    isSuperDriver: true,
    responseHours: 0.5,
  },
  notes: 'Expressway tolls included in seat price. Leaving on time from Fort.',
  status: 'published',
};

test('Non-overlapping partial-leg (Boost) bookings share the same physical seat without conflict', () => {
  const leg1 = canBookLeg(sampleSouthernRide, 'colombo', 'dodangoda', 2);
  assert.equal(leg1.allowed, true);
  assert.equal(leg1.isBoostLeg, true);
  assert.equal(leg1.legPriceLkr, 1100);

  const afterLeg1 = applyLegBooking(sampleSouthernRide, leg1.fromIndex, leg1.toIndex, 2);
  assert.deepEqual(afterLeg1.segmentSeatsAvailable, [0, 2, 2]);

  // Another group of 2 can still book Dodangoda -> Matara on those same 2 physical seats!
  const leg2 = canBookLeg(afterLeg1, 'dodangoda', 'matara', 2);
  assert.equal(leg2.allowed, true);
  assert.equal(leg2.availableSeatsOnLeg, 2);
  assert.equal(leg2.legPriceLkr, 2100);

  // Overlapping Colombo -> Galle must be rejected because segment 0 has 0 seats left
  const overlapping = canBookLeg(afterLeg1, 'colombo', 'galle', 1);
  assert.equal(overlapping.allowed, false);

  // Releasing leg 1 restores capacity
  const restored = releaseLegBooking(afterLeg1, leg1.fromIndex, leg1.toIndex, 2);
  assert.deepEqual(restored.segmentSeatsAvailable, [2, 2, 2]);
});

test('searchRides and assignSmartTags label Cheapest, Earliest, Fastest and filter by comfort/trust', () => {
  const slowerCheaperRide: Ride = {
    ...sampleSouthernRide,
    id: 'ride-a2-galle',
    hasTolls: false,
    departureAt: '2026-11-02T06:15:00+05:30',
    arrivalAt: '2026-11-02T09:30:00+05:30',
    fullPriceLkr: 2200,
    stops: sampleSouthernRide.stops.map((s) =>
      s.hubId === 'galle'
        ? { ...s, arrivalAt: '2026-11-02T08:50:00+05:30', priceFromOriginLkr: 1750 }
        : s.hubId === 'colombo'
          ? { ...s, departureAt: '2026-11-02T06:15:00+05:30' }
          : s
    ),
  };

  const results = searchRides([sampleSouthernRide, slowerCheaperRide], {
    fromHubId: 'colombo',
    toHubId: 'galle',
    date: '2026-11-02',
    seats: 1,
  });

  assert.equal(results.length, 2);
  const tagged = assignSmartTags(results);
  const a2Result = tagged.find((r) => r.ride.id === 'ride-a2-galle')!;
  const e01Result = tagged.find((r) => r.ride.id === 'ride-e01-matara')!;

  assert.ok(a2Result.smartTags.includes('cheapest'));
  assert.ok(a2Result.smartTags.includes('earliest'));
  assert.ok(e01Result.smartTags.includes('fastest'));
});
