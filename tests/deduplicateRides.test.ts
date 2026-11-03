import { describe, it } from 'node:test';
import assert from 'node:assert';
import { deduplicateRides, type Ride } from '../src/domain/matching.ts';

describe('deduplicateRides', () => {
  const baseRide: Ride = {
    id: 'ride-1',
    driverId: 'drv-karthik',
    corridorId: 'e03-airport-northern-a9',
    corridorCode: 'E03 / A9',
    corridorName: 'Airport Expressway + A9 Northern Corridor (Tolls)',
    hasTolls: true,
    tollPolicy: 'included',
    estimatedTollLkr: 350,
    originHubId: 'colombo',
    destinationHubId: 'jaffna',
    departureDate: '2026-11-02',
    departureAt: '2026-11-02T05:00:00+05:30',
    arrivalAt: '2026-11-02T12:40:00+05:30',
    totalDistanceKm: 418,
    fullPriceLkr: 7900,
    recommendedPriceLkr: 8550,
    totalSeats: 4,
    segmentSeatsAvailable: [4, 4],
    stops: [],
    approvalMode: 'instant',
    boostEnabled: true,
    luggageCapacity: 'medium',
    vehicle: { makeModel: 'Toyota Prius', category: 'car', plateHint: 'WP CAA-84xx', acGuaranteed: true },
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
      id: 'drv-karthik',
      name: 'Karthik Sivakumar',
      rating: 4.95,
      ratingsCount: 88,
      drivingSkillScore: 3.0,
      completedRides: 54,
      verifiedPhone: true,
      verifiedNic: true,
      verifiedLicence: true,
      isSuperDriver: true,
      responseHours: 0.2,
      bio: 'Regular long-distance commuter',
    },
    notes: 'Direct expressway',
    status: 'published',
  };

  it('filters out 257 duplicate copies of the same ride with identical id', () => {
    const ridesWith257Duplicates = Array.from({ length: 257 }, () => ({ ...baseRide }));
    const deduplicated = deduplicateRides(ridesWith257Duplicates);
    assert.strictEqual(deduplicated.length, 1);
    assert.strictEqual(deduplicated[0].id, 'ride-1');
  });

  it('filters out rides with different ids but identical journey fingerprint', () => {
    const duplicateFingerprintRides: Ride[] = [
      { ...baseRide, id: 'ride-1' },
      { ...baseRide, id: 'ride-dup-2' },
      { ...baseRide, id: 'ride-dup-3' },
    ];
    const deduplicated = deduplicateRides(duplicateFingerprintRides);
    assert.strictEqual(deduplicated.length, 1);
    assert.strictEqual(deduplicated[0].id, 'ride-1');
  });

  it('preserves distinct rides with different corridors or departure times', () => {
    const rides: Ride[] = [
      { ...baseRide, id: 'ride-1' },
      {
        ...baseRide,
        id: 'ride-2',
        originHubId: 'makumbura',
        destinationHubId: 'galle',
        corridorId: 'e01-southern-expressway',
      },
      {
        ...baseRide,
        id: 'ride-3',
        departureAt: '2026-11-03T07:00:00+05:30',
      },
    ];
    const deduplicated = deduplicateRides(rides);
    assert.strictEqual(deduplicated.length, 3);
  });

  it('handles empty, null, or undefined array gracefully', () => {
    assert.deepStrictEqual(deduplicateRides([]), []);
    assert.deepStrictEqual(deduplicateRides(null as any), []);
    assert.deepStrictEqual(deduplicateRides(undefined as any), []);
  });
});
