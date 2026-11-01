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
  departureDate: '2026-11-02',
  departureTime: '07:30',
  departureAt: '2026-11-02T07:30:00+05:30',
  totalSeats: 3,
  availableSeats: 3,
  fullPriceLkr: 1850,
  approvalMode: 'instant',
  luggageCapacity: 'medium',
  hasTolls: true,
  driver: {
    id: '+94772345678',
    name: 'Kasun Perera',
    rating: 4.9,
    ratingsCount: 38,
    isSuperDriver: true,
    verifiedPhone: true,
    verifiedNic: true,
    verifiedLicence: true,
    completedRides: 42,
    responseHours: 0.5,
  },
  vehicle: {
    makeModel: 'Toyota Aqua',
    color: 'Pearl White',
    licensePlate: 'WP CAB-1234',
    category: 'compact',
    acGuaranteed: true,
  },
  comfort: {
    ac: true,
    smoking: 'no',
    pets: 'no',
    max2InBack: true,
    music: 'yes',
    luggage: 'medium',
  },
  stops: [
    {
      hubId: 'colombo',
      stopIndex: 0,
      departureAt: '2026-11-02T07:30:00+05:30',
      kmFromOrigin: 0,
      pickupLandmark: 'Fort Railway Station Entrance',
    },
    {
      hubId: 'galle',
      stopIndex: 1,
      departureAt: '2026-11-02T09:00:00+05:30',
      arrivalAt: '2026-11-02T09:00:00+05:30',
      kmFromOrigin: 119,
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
    totalPriceLkr: 3700,
    settlementMethod: 'lankaqr',
    boardingPin: '5821',
    status: 'accepted',
    createdAt: '2026-11-02T08:00:00Z',
  };

  const row = mapBookingToRow(booking);
  assert.equal(row.id, booking.id);
  assert.equal(row.ride_id, booking.rideId);
  assert.equal(row.passenger_id, booking.passengerId);
  assert.equal(row.boarding_pin, '5821');

  const reconstructed = mapRowToBooking(row);
  assert.equal(reconstructed.id, booking.id);
  assert.equal(reconstructed.rideId, booking.rideId);
  assert.equal(reconstructed.seats, 2);
  assert.equal(reconstructed.boardingPin, '5821');
  assert.equal(reconstructed.settlementMethod, 'lankaqr');
});
