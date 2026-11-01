import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import type { Ride, LuggageSize, RideStop } from '../domain/matching.ts';
import type { BookingRecord } from './types.ts';
import { deriveBoardingPin } from '../domain/sharing.ts';

export interface PostgresRideRow {
  id: string;
  driver_id: string;
  origin_hub_id: string;
  destination_hub_id: string;
  corridor_id: string;
  corridor_code: string;
  departure_date: string;
  departure_time: string;
  departure_at: string;
  return_ride_id?: string | null;
  total_seats: number;
  available_seats: number;
  full_price_lkr: number;
  approval_mode: string;
  luggage_capacity: string;
  has_tolls: boolean;
  driver: Record<string, any>;
  vehicle: Record<string, any>;
  comfort: Record<string, any>;
  stops: Record<string, any>[];
  created_at?: string;
}

export interface PostgresBookingRow {
  id: string;
  ride_id: string;
  passenger_id: string;
  passenger_name: string;
  passenger_phone: string;
  from_hub_id: string;
  to_hub_id: string;
  from_index: number;
  to_index: number;
  seats: number;
  total_price_lkr: number;
  settlement_method: string;
  boarding_pin: string;
  status: string;
  created_at?: string;
}

export function mapRideToRow(ride: Ride): PostgresRideRow {
  const minAvailable =
    ride.segmentSeatsAvailable && ride.segmentSeatsAvailable.length > 0
      ? Math.min(...ride.segmentSeatsAvailable)
      : ride.totalSeats;

  const depTime = ride.departureAt.includes('T')
    ? ride.departureAt.split('T')[1].slice(0, 5)
    : '07:00';

  return {
    id: ride.id,
    driver_id: ride.driverId,
    origin_hub_id: ride.originHubId,
    destination_hub_id: ride.destinationHubId,
    corridor_id: ride.corridorId,
    corridor_code: ride.corridorCode,
    departure_date: ride.departureDate,
    departure_time: depTime,
    departure_at: ride.departureAt,
    return_ride_id: ride.returnRideId || null,
    total_seats: ride.totalSeats,
    available_seats: minAvailable,
    full_price_lkr: ride.fullPriceLkr,
    approval_mode: ride.approvalMode,
    luggage_capacity: ride.luggageCapacity ?? ride.comfort?.luggage ?? 'medium',
    has_tolls: Boolean(ride.hasTolls),
    driver: ride.driver,
    vehicle: ride.vehicle,
    comfort: ride.comfort,
    stops: ride.stops as any[],
  };
}

export function mapRowToRide(row: PostgresRideRow): Ride {
  const stops = (row.stops || []) as RideStop[];
  const lastStop = stops[stops.length - 1];
  const totalSeats = Number(row.total_seats) || 3;
  const availSeats = Number(row.available_seats) || totalSeats;

  return {
    id: row.id,
    driverId: row.driver_id,
    originHubId: row.origin_hub_id,
    destinationHubId: row.destination_hub_id,
    corridorId: row.corridor_id,
    corridorCode: row.corridor_code,
    corridorName: row.corridor_code,
    hasTolls: Boolean(row.has_tolls),
    tollPolicy: 'included',
    estimatedTollLkr: 0,
    departureDate: row.departure_date,
    departureAt: row.departure_at,
    arrivalAt: lastStop?.arrivalAt || row.departure_at,
    totalDistanceKm: lastStop?.kmFromOrigin || 100,
    fullPriceLkr: Number(row.full_price_lkr),
    recommendedPriceLkr: Number(row.full_price_lkr),
    totalSeats,
    segmentSeatsAvailable: stops.length > 1 ? Array(stops.length - 1).fill(availSeats) : [availSeats],
    stops,
    approvalMode: (row.approval_mode as Ride['approvalMode']) || 'instant',
    luggageCapacity: (row.luggage_capacity as LuggageSize) || 'medium',
    returnRideId: row.return_ride_id || undefined,
    driver: row.driver as Ride['driver'],
    vehicle: row.vehicle as Ride['vehicle'],
    comfort: row.comfort as Ride['comfort'],
    boostEnabled: true,
    notes: '',
    status: 'published',
  };
}

export function mapBookingToRow(b: BookingRecord): PostgresBookingRow {
  return {
    id: b.id,
    ride_id: b.rideId,
    passenger_id: b.passengerId,
    passenger_name: b.passengerName,
    passenger_phone: b.passengerPhone,
    from_hub_id: b.fromHubId,
    to_hub_id: b.toHubId,
    from_index: b.fromIndex,
    to_index: b.toIndex,
    seats: b.seats,
    total_price_lkr: b.totalPriceLkr,
    settlement_method: b.settlementMethod,
    boarding_pin: deriveBoardingPin(b.id),
    status: b.status,
  };
}

export function mapRowToBooking(row: PostgresBookingRow): BookingRecord {
  const seats = Number(row.seats) || 1;
  const totalPrice = Number(row.total_price_lkr) || 0;

  return {
    id: row.id,
    rideId: row.ride_id,
    passengerId: row.passenger_id,
    passengerName: row.passenger_name,
    passengerPhone: row.passenger_phone,
    fromHubId: row.from_hub_id,
    toHubId: row.to_hub_id,
    fromIndex: Number(row.from_index),
    toIndex: Number(row.to_index),
    seats,
    unitPriceLkr: seats > 0 ? Math.round(totalPrice / seats) : totalPrice,
    totalPriceLkr: totalPrice,
    isBoostLeg: false,
    settlementMethod: (row.settlement_method as BookingRecord['settlementMethod']) || 'lankaqr',
    status: (row.status as BookingRecord['status']) || 'accepted',
    message: '',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export async function fetchRemoteRides(): Promise<Ride[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .order('departure_at', { ascending: true });

    if (error) {
      console.warn('Supabase fetchRemoteRides error:', error.message);
      return null;
    }
    if (!data || data.length === 0) {
      return [];
    }
    return data.map((row) => mapRowToRide(row as PostgresRideRow));
  } catch (err) {
    console.warn('Supabase fetchRemoteRides failed (offline fallback):', err);
    return null;
  }
}

export async function persistRemoteRide(ride: Ride): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const row = mapRideToRow(ride);
    if (ride.driver) {
      await supabase.from('profiles').upsert({
        id: ride.driverId,
        name: ride.driver.name,
        phone: ride.driver.phone || ride.driverId,
        verified_phone: Boolean(ride.driver.verifiedPhone),
        verified_nic: Boolean(ride.driver.verifiedNic),
        verified_licence: Boolean(ride.driver.verifiedLicence),
        is_super_driver: Boolean(ride.driver.isSuperDriver),
        overall_rating: ride.driver.rating || 5.0,
        ratings_count: ride.driver.ratingsCount || 0,
        default_vehicle: ride.vehicle?.makeModel,
      });
    }

    const { error } = await supabase.from('rides').upsert(row);
    if (error) {
      console.warn('Supabase persistRemoteRide error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase persistRemoteRide failed:', err);
    return false;
  }
}

export async function persistRemoteBooking(booking: BookingRecord): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const row = mapBookingToRow(booking);
    const { error } = await supabase.from('bookings').upsert(row);
    if (error) {
      console.warn('Supabase persistRemoteBooking error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase persistRemoteBooking failed:', err);
    return false;
  }
}

export async function seedRemoteRidesIfEmpty(seededRides: Ride[]): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const { count, error } = await supabase
      .from('rides')
      .select('*', { count: 'exact', head: true });

    if (!error && (count === 0 || count === null)) {
      const rows = seededRides.map(mapRideToRow);
      await supabase.from('rides').upsert(rows);
    }
  } catch {
    // Non-blocking fallback
  }
}

export async function initRemoteSync(store: {
  getState: () => { rides: Ride[] };
  setRides: (rides: Ride[]) => void;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const localRides = store.getState().rides;
    await seedRemoteRidesIfEmpty(localRides);
    const remoteRides = await fetchRemoteRides();
    if (remoteRides && remoteRides.length > 0) {
      store.setRides(remoteRides);
    }
  } catch (err) {
    console.warn('initRemoteSync non-blocking error:', err);
  }
}
