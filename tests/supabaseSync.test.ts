import test from 'node:test';
import assert from 'node:assert/strict';
import { mapRideToRow, mapRowToRide, mapBookingToRow, mapRowToBooking } from '../src/state/supabaseSync.ts';
import type { Ride } from '../src/domain/matching.ts';
import type { BookingRecord } from '../src/state/types.ts';

const mockRide: Ride = {
  id: 'ride-colombo-galle-test',
  driverId: '+94772345678',
  originHubId: 'colombo',
  destinationHubId: 'galle',
  corridorId: 'southern-expressway-e01',
  corridorCode: 'E01',
  corridorName: 'Southern Expressway',
  hasTolls: true,
  tollPolicy: 'included',
  estimatedTollLkr: 600,
  departureDate: '2026-11-02',
  departureAt: '2026-11-02T07:30:00+05:30',
  arrivalAt: '2026-11-02T09:00:00+05:30',
  totalDistanceKm: 119,
  fullPriceLkr: 1850,
  recommendedPriceLkr: 1850,
  totalSeats: 3,
  segmentSeatsAvailable: [3],
  approvalMode: 'instant',
  luggageCapacity: 'medium',
  boostEnabled: true,
  notes: 'Clean ride',
  status: 'published',
  driver: {
    id: '+94772345678',
    name: 'Kasun Perera',
    rating: 4.9,
    ratingsCount: 38,
    isSuperDriver: true,
    drivingSkillScore: 4.8,
    verifiedPhone: true,
    verifiedNic: true,
    verifiedLicence: true,
    completedRides: 42,
    responseHours: 0.5,
  },
  vehicle: {
    makeModel: 'Toyota Aqua',
    plateHint: 'WP CAB-1234',
    category: 'car',
    acGuaranteed: true,
  },
  comfort: {
    chattiness: 'bla',
    smoking: 'no',
    pets: 'no',
    maxTwoInBack: true,
    music: 'yes',
    luggage: 'medium',
    womenOnly: false,
  },
  stops: [
    {
      hubId: 'colombo',
      stopIndex: 0,
      departureAt: '2026-11-02T07:30:00+05:30',
      arrivalAt: '2026-11-02T07:30:00+05:30',
      kmFromOrigin: 0,
      priceFromOriginLkr: 0,
      pickupLandmark: 'Fort Railway Station Entrance',
    },
    {
      hubId: 'galle',
      stopIndex: 1,
      departureAt: '2026-11-02T09:00:00+05:30',
      arrivalAt: '2026-11-02T09:00:00+05:30',
      kmFromOrigin: 119,
      priceFromOriginLkr: 1850,
      pickupLandmark: 'Galle Fort Main Gate',
    },
  ],
};

test('mapRideToRow correctly transforms domain Ride to Postgres row', () => {
  const row = mapRideToRow(mockRide);
  assert.equal(row.id, mockRide.id);
  assert.equal(row.driver_id, mockRide.driverId);
  assert.equal(row.origin_hub_id, mockRide.originHubId);
  assert.equal(row.destination_hub_id, mockRide.destinationHubId);
  assert.equal(row.corridor_id, mockRide.corridorId);
  assert.equal(row.full_price_lkr, mockRide.fullPriceLkr);
  assert.equal(row.luggage_capacity, mockRide.luggageCapacity);
  assert.equal(row.has_tolls, true);
});

test('mapRowToRide correctly reconstructs domain Ride from Postgres row', () => {
  const row = mapRideToRow(mockRide);
  const reconstructed = mapRowToRide(row);

  assert.equal(reconstructed.id, mockRide.id);
  assert.equal(reconstructed.driverId, mockRide.driverId);
  assert.equal(reconstructed.fullPriceLkr, mockRide.fullPriceLkr);
  assert.equal(reconstructed.luggageCapacity, mockRide.luggageCapacity);
  assert.equal(reconstructed.driver.name, 'Kasun Perera');
  assert.equal(reconstructed.stops.length, 2);
});

test('mapBookingToRow and mapRowToBooking bidirectional parity', () => {
  const booking: BookingRecord = {
    id: 'bk-test-1',
    rideId: mockRide.id,
    passengerId: '+94779998888',
    passengerName: 'Nimal Silva',
    passengerPhone: '+94779998888',
    fromHubId: 'colombo',
    toHubId: 'galle',
    fromIndex: 0,
    toIndex: 1,
    seats: 2,
    unitPriceLkr: 1850,
    totalPriceLkr: 3700,
    isBoostLeg: false,
    settlementMethod: 'lankaqr',
    status: 'accepted',
    message: 'Hello',
    createdAt: '2026-11-02T08:00:00Z',
  };

  const row = mapBookingToRow(booking);
  assert.equal(row.id, booking.id);
  assert.equal(row.ride_id, booking.rideId);
  assert.equal(row.passenger_id, booking.passengerId);
  assert.equal(row.boarding_pin.length, 4);

  const reconstructed = mapRowToBooking(row);
  assert.equal(reconstructed.id, booking.id);
  assert.equal(reconstructed.rideId, booking.rideId);
  assert.equal(reconstructed.seats, 2);
  assert.equal(reconstructed.settlementMethod, 'lankaqr');
});
