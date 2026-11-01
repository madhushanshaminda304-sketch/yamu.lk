-- Yamu (Sri Lanka Intercity Carpooling) Database Schema
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/ykjmjwlvucbzmgfdyjfd/sql

-- 1. Profiles Table (Commuters & Verified Drivers)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  nic_number TEXT,
  licence_number TEXT,
  verified_phone BOOLEAN DEFAULT false,
  verified_nic BOOLEAN DEFAULT false,
  verified_licence BOOLEAN DEFAULT false,
  is_super_driver BOOLEAN DEFAULT false,
  overall_rating NUMERIC DEFAULT 5.0,
  ratings_count INTEGER DEFAULT 0,
  default_vehicle TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Rides Table (Corridor Carpool Journeys)
CREATE TABLE IF NOT EXISTS public.rides (
  id TEXT PRIMARY KEY,
  driver_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  origin_hub_id TEXT NOT NULL,
  destination_hub_id TEXT NOT NULL,
  corridor_id TEXT NOT NULL,
  corridor_code TEXT NOT NULL,
  departure_date TEXT NOT NULL,
  departure_time TEXT NOT NULL,
  departure_at TIMESTAMPTZ NOT NULL,
  return_ride_id TEXT,
  total_seats INTEGER NOT NULL DEFAULT 3,
  available_seats INTEGER NOT NULL DEFAULT 3,
  full_price_lkr NUMERIC NOT NULL,
  approval_mode TEXT NOT NULL DEFAULT 'instant', -- 'instant' | 'manual'
  luggage_capacity TEXT NOT NULL DEFAULT 'medium', -- 'small' | 'medium' | 'large'
  has_tolls BOOLEAN NOT NULL DEFAULT false,
  driver JSONB NOT NULL,
  vehicle JSONB NOT NULL,
  comfort JSONB NOT NULL,
  stops JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Bookings Table (Seat Reservations & Digital Ride Passes)
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY,
  ride_id TEXT REFERENCES public.rides(id) ON DELETE CASCADE,
  passenger_id TEXT NOT NULL,
  passenger_name TEXT NOT NULL,
  passenger_phone TEXT NOT NULL,
  from_hub_id TEXT NOT NULL,
  to_hub_id TEXT NOT NULL,
  from_index INTEGER NOT NULL,
  to_index INTEGER NOT NULL,
  seats INTEGER NOT NULL DEFAULT 1,
  total_price_lkr NUMERIC NOT NULL,
  settlement_method TEXT NOT NULL DEFAULT 'lankaqr', -- 'lankaqr' | 'cash_lkr'
  boarding_pin TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'accepted', -- 'pending' | 'accepted' | 'declined' | 'cancelled'
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Messages Table (Driver-Passenger Ride Coordination)
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  booking_id TEXT REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  text TEXT NOT NULL,
  flagged_as_scam BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_rides_search ON public.rides (departure_date, origin_hub_id, destination_hub_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver ON public.rides (driver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_ride ON public.bookings (ride_id);
CREATE INDEX IF NOT EXISTS idx_bookings_passenger ON public.bookings (passenger_id);
CREATE INDEX IF NOT EXISTS idx_messages_booking ON public.messages (booking_id);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 7. Public API Access Policies (For Yamu web app)
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update profiles" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Public read rides" ON public.rides FOR SELECT USING (true);
CREATE POLICY "Public insert rides" ON public.rides FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update rides" ON public.rides FOR UPDATE USING (true);

CREATE POLICY "Public read bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Public insert bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update bookings" ON public.bookings FOR UPDATE USING (true);

CREATE POLICY "Public read messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Public insert messages" ON public.messages FOR INSERT WITH CHECK (true);
