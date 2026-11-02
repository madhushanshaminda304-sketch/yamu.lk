import test from 'node:test';
import assert from 'node:assert/strict';
import { formatSriLankanPlate } from '../src/domain/carPlate.ts';
import { searchRides, type Ride } from '../src/domain/matching.ts';
import { buildEmergencySosText, buildForgottenItemRecoveryUrl } from '../src/domain/sharing.ts';

test('formatSriLankanPlate formats, normalizes, and masks standard Sri Lankan vehicle plates', () => {
  const parsed = formatSriLankanPlate('WP CAB-1234');
  assert.equal(parsed.province, 'WP');
  assert.equal(parsed.registration, 'CAB-1234');
  assert.equal(parsed.full, 'WP CAB-1234');
  assert.equal(parsed.masked, 'WP CAB-••••');
  assert.equal(parsed.isEv, false);

  const evPlate = formatSriLankanPlate('SP EK-5678');
  assert.equal(evPlate.isEv, true);
  assert.equal(evPlate.province, 'SP');
  assert.equal(evPlate.registration, 'EK-5678');

  // Edge cases / unformatted inputs
  const rawPlate = formatSriLankanPlate('cp-kq 9901');
  assert.equal(rawPlate.province, 'CP');
  assert.equal(rawPlate.registration, 'KQ-9901');
  assert.equal(rawPlate.masked, 'CP KQ-••••');

  const fallback = formatSriLankanPlate('Toyota Aqua');
  assert.equal(fallback.province, 'WP');
  assert.equal(fallback.registration, 'Toyota Aqua');
});

test('searchRides filters by special requirements: child seat, wheelchair, and airport transit', () => {
  const dummyRide: Ride = {
    id: 'ride-special-1',
    driverId: 'd-1',
    corridorId: 'colombo-galle-e01',
    corridorCode: 'E01',
    corridorName: 'Southern Expressway',
    hasTolls: true,
    tollPolicy: 'included',
    estimatedTollLkr: 500,
    originHubId: 'colombo',
    destinationHubId: 'galle',
    departureDate: '2026-11-04',
    departureAt: '2026-11-04T08:00:00+05:30',
    arrivalAt: '2026-11-04T10:00:00+05:30',
    totalDistanceKm: 120,
    fullPriceLkr: 2000,
    recommendedPriceLkr: 2000,
    totalSeats: 3,
    segmentSeatsAvailable: [3],
    stops: [
      { hubId: 'colombo', stopIndex: 0, arrivalAt: '2026-11-04T08:00:00+05:30', departureAt: '2026-11-04T08:00:00+05:30', kmFromOrigin: 0, priceFromOriginLkr: 0, pickupLandmark: 'Fort' },
      { hubId: 'galle', stopIndex: 1, arrivalAt: '2026-11-04T10:00:00+05:30', departureAt: '2026-11-04T10:00:00+05:30', kmFromOrigin: 120, priceFromOriginLkr: 2000, pickupLandmark: 'Gate' }
    ],
    approvalMode: 'instant',
    boostEnabled: false,
    vehicle: { makeModel: 'Toyota Prius', category: 'car', plateHint: 'WP CAB-••••', plateNumber: 'WP CAB-1234', acGuaranteed: true },
    comfort: { chattiness: 'blabla', maxTwoInBack: true, luggage: 'medium', music: 'yes', pets: 'no', smoking: 'no', womenOnly: false },
    driver: { id: 'd-1', name: 'Sunil', rating: 4.9, ratingsCount: 10, drivingSkillScore: 2.9, completedRides: 8, verifiedPhone: true, verifiedNic: true, verifiedLicence: true, isSuperDriver: true, responseHours: 1 },
    notes: '',
    status: 'published',
    journeyStatus: 'scheduled',
    specialRequirements: {
      childSeatAvailable: true,
      wheelchairAccessible: false,
      airportFlightTransfer: true,
    }
  };

  const rides = [dummyRide];

  // Match child seat
  const matchChild = searchRides(rides, { fromHubId: 'colombo', toHubId: 'galle', date: '2026-11-04', seats: 1, childSeatOnly: true });
  assert.equal(matchChild.length, 1);

  // Wheelchair only should return 0
  const matchWheelchair = searchRides(rides, { fromHubId: 'colombo', toHubId: 'galle', date: '2026-11-04', seats: 1, wheelchairOnly: true });
  assert.equal(matchWheelchair.length, 0);

  // Airport transfer should match
  const matchAirport = searchRides(rides, { fromHubId: 'colombo', toHubId: 'galle', date: '2026-11-04', seats: 1, airportOnly: true });
  assert.equal(matchAirport.length, 1);
});

test('buildEmergencySosText and buildForgottenItemRecoveryUrl format proper texts', () => {
  const sos = buildEmergencySosText({
    passengerName: 'Kamal Perera',
    driverName: 'Sunil Silva',
    driverPhone: '+94771234567',
    vehiclePlate: 'WP CAB-1234',
    vehicleModel: 'Toyota Aqua',
    fromName: 'Colombo Fort',
    toName: 'Galle Hub',
    boardingPin: '1234',
  });
  assert.match(sos, /EMERGENCY/);
  assert.match(sos, /Sunil Silva/);
  assert.match(sos, /WP CAB-1234/);
  assert.match(sos, /#1234/);

  const recoveryUrl = buildForgottenItemRecoveryUrl({
    driverPhone: '+94771234567',
    driverName: 'Sunil',
    fromName: 'Colombo',
    toName: 'Galle',
    tripDate: '2026-11-04',
    boardingPin: '1234',
    vehicleModel: 'Toyota Aqua',
    vehiclePlate: 'WP CAB-1234',
  });
  assert.match(recoveryUrl, /wa\.me\/94771234567/);
  assert.match(decodeURIComponent(recoveryUrl), /left an item in your car/);
});
