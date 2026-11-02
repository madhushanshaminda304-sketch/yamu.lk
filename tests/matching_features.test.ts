import test from 'node:test';
import assert from 'node:assert/strict';
import { searchRides, type Ride, type SearchQuery } from '../src/domain/matching.ts';

test('matching domain features: vehicle category, quiet ride, and journey status', async (t) => {
  const baseRide: Ride = {
    id: 'ride-test-1',
    driverId: 'driver-1',
    corridorId: 'e01-southern-expressway',
    corridorCode: 'E01',
    corridorName: 'Southern Expressway',
    hasTolls: true,
    tollPolicy: 'included',
    estimatedTollLkr: 400,
    originHubId: 'colombo',
    destinationHubId: 'galle',
    departureDate: '2026-11-10',
    departureAt: '2026-11-10T08:00:00+05:30',
    arrivalAt: '2026-11-10T09:30:00+05:30',
    totalDistanceKm: 116,
    fullPriceLkr: 2000,
    recommendedPriceLkr: 2000,
    totalSeats: 3,
    segmentSeatsAvailable: [3],
    stops: [
      {
        hubId: 'colombo',
        stopIndex: 0,
        arrivalAt: '2026-11-10T08:00:00+05:30',
        departureAt: '2026-11-10T08:00:00+05:30',
        kmFromOrigin: 0,
        priceFromOriginLkr: 0,
        pickupLandmark: 'Colombo Fort Station',
      },
      {
        hubId: 'galle',
        stopIndex: 1,
        arrivalAt: '2026-11-10T09:30:00+05:30',
        departureAt: '2026-11-10T09:30:00+05:30',
        kmFromOrigin: 116,
        priceFromOriginLkr: 2000,
        pickupLandmark: 'Galle Fort Gate',
      },
    ],
    approvalMode: 'instant',
    boostEnabled: true,
    vehicle: {
      makeModel: 'Toyota Aqua',
      category: 'car',
      plateHint: 'WP CAH-1234',
      acGuaranteed: true,
    },
    comfort: {
      chattiness: 'bla',
      maxTwoInBack: true,
      luggage: 'medium',
      music: 'no',
      pets: 'no',
      smoking: 'no',
      womenOnly: false,
      quietRide: true,
    },
    driver: {
      id: 'driver-1',
      name: 'Test Driver',
      rating: 4.9,
      ratingsCount: 20,
      drivingSkillScore: 2.8,
      completedRides: 25,
      verifiedPhone: true,
      verifiedNic: true,
      verifiedLicence: true,
      isSuperDriver: true,
      responseHours: 1,
    },
    notes: 'Direct morning commute',
    journeyStatus: 'scheduled',
    status: 'published',
  };

  const vanRide: Ride = {
    ...baseRide,
    id: 'ride-van-2',
    vehicle: {
      makeModel: 'Toyota KDH Van',
      category: 'van',
      plateHint: 'WP NB-5678',
      acGuaranteed: true,
    },
    comfort: {
      ...baseRide.comfort,
      quietRide: false,
    },
  };

  const rides = [baseRide, vanRide];

  await t.test('filters rides by vehicleCategory', () => {
    const carQuery: SearchQuery = {
      fromHubId: 'colombo',
      toHubId: 'galle',
      date: '2026-11-10',
      seats: 1,
      vehicleCategory: 'car',
    };
    const carResults = searchRides(rides, carQuery);
    assert.equal(carResults.length, 1);
    assert.equal(carResults[0].ride.id, 'ride-test-1');

    const vanQuery: SearchQuery = {
      ...carQuery,
      vehicleCategory: 'van',
    };
    const vanResults = searchRides(rides, vanQuery);
    assert.equal(vanResults.length, 1);
    assert.equal(vanResults[0].ride.id, 'ride-van-2');
  });

  await t.test('filters rides by quietRideOnly', () => {
    const quietQuery: SearchQuery = {
      fromHubId: 'colombo',
      toHubId: 'galle',
      date: '2026-11-10',
      seats: 1,
      quietRideOnly: true,
    };
    const quietResults = searchRides(rides, quietQuery);
    assert.equal(quietResults.length, 1);
    assert.equal(quietResults[0].ride.id, 'ride-test-1');
  });

  await t.test('ride carries default journeyStatus scheduled', () => {
    assert.equal(baseRide.journeyStatus, 'scheduled');
  });
});
