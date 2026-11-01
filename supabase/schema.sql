-- BlaBlaCar Sri Lanka (blablacar-lk) PostgreSQL / Supabase Schema
-- Reverse-engineered from blablacar.in and adapted to Sri Lankan corridors, LKR cost-sharing, and NIC/Super Driver trust.

create extension if not exists pgcrypto;

create table public.hubs (
  id text primary key,
  name_en text not null,
  name_si text not null,
  name_ta text not null,
  district text not null,
  province text not null,
  is_expressway_interchange boolean not null default false,
  lat double precision not null,
  lng double precision not null
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 80),
  email text not null unique,
  phone text not null check (phone ~ '^\+947[0-9]{8}$'),
  nic_number text check (nic_number ~ '^([0-9]{9}[vVxX]|(19|20)[0-9]{10})$'),
  licence_number text,
  verified_phone boolean not null default false,
  verified_nic boolean not null default false,
  verified_licence boolean not null default false,
  has_profile_photo boolean not null default false,
  chattiness text not null default 'blabla' check (chattiness in ('bla', 'blabla', 'blablabla')),
  max_two_in_back boolean not null default true,
  women_only_default boolean not null default false,
  completed_rides_12m integer not null default 0,
  overall_rating numeric(3,2) not null default 5.00,
  driving_skill_score numeric(3,2) not null default 3.00,
  cancellation_rate_pct numeric(5,2) not null default 0.00,
  avg_response_hours numeric(5,2) not null default 1.00,
  created_at timestamptz not null default now()
);

create table public.rides (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles(id) on delete cascade,
  corridor_id text not null,
  corridor_code text not null,
  has_tolls boolean not null default false,
  toll_policy text not null default 'no_tolls' check (toll_policy in ('included', 'split_at_gate', 'no_tolls')),
  origin_hub_id text not null references public.hubs(id),
  destination_hub_id text not null references public.hubs(id),
  departure_at timestamptz not null,
  arrival_at timestamptz not null,
  total_distance_km integer not null check (total_distance_km >= 10),
  recommended_price_lkr integer not null check (recommended_price_lkr >= 150),
  full_price_lkr integer not null check (full_price_lkr >= 150 and full_price_lkr <= round(recommended_price_lkr * 1.25) + 50),
  total_seats integer not null check (total_seats between 1 and 6),
  segment_seats_available integer[] not null,
  approval_mode text not null default 'instant' check (approval_mode in ('instant', 'manual')),
  boost_enabled boolean not null default true,
  vehicle_make_model text not null,
  vehicle_category text not null check (vehicle_category in ('car', 'suv', 'van')),
  ac_guaranteed boolean not null default true,
  max_two_in_back boolean not null default true,
  women_only boolean not null default false,
  luggage_size text not null default 'medium' check (luggage_size in ('small', 'medium', 'large')),
  notes text not null default '',
  status text not null default 'published' check (status in ('published', 'cancelled')),
  created_at timestamptz not null default now()
);

create table public.ride_stops (
  ride_id uuid not null references public.rides(id) on delete cascade,
  stop_index integer not null,
  hub_id text not null references public.hubs(id),
  arrival_at timestamptz not null,
  departure_at timestamptz not null,
  km_from_origin integer not null,
  price_from_origin_lkr integer not null,
  pickup_landmark text not null,
  is_boost_stop boolean not null default false,
  primary key (ride_id, stop_index)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  passenger_id uuid not null references public.profiles(id) on delete cascade,
  from_hub_id text not null references public.hubs(id),
  to_hub_id text not null references public.hubs(id),
  from_stop_index integer not null,
  to_stop_index integer not null check (to_stop_index > from_stop_index),
  seats integer not null check (seats between 1 and 6),
  unit_price_lkr integer not null check (unit_price_lkr >= 150),
  total_price_lkr integer not null check (total_price_lkr >= 150),
  is_boost_leg boolean not null default false,
  settlement_method text not null default 'cash_lkr' check (settlement_method in ('cash_lkr', 'lankaqr')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now()
);

create table public.ride_alerts (
  id uuid primary key default gen_random_uuid(),
  from_hub_id text not null references public.hubs(id),
  to_hub_id text not null references public.hubs(id),
  travel_date date not null,
  email text not null,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table public.double_blind_ratings (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id uuid not null references public.profiles(id) on delete cascade,
  stars integer not null check (stars between 1 and 5),
  driving_skill text check (driving_skill in ('poor', 'average', 'excellent')),
  comment text not null default '',
  trip_arrival_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (booking_id, from_user_id)
);


-- =============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================

alter table public.hubs enable row level security;
alter table public.profiles enable row level security;
alter table public.rides enable row level security;
alter table public.ride_stops enable row level security;
alter table public.bookings enable row level security;
alter table public.ride_alerts enable row level security;
alter table public.messages enable row level security;
alter table public.double_blind_ratings enable row level security;

-- 1. Hubs Policies
create policy "Hubs are public"
  on public.hubs for select
  using (true);

-- 2. Profiles Policies
create policy "Public profile viewing"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 3. Rides & Stops Policies
create policy "Published rides viewable by all"
  on public.rides for select
  using (status = 'published');

create policy "Drivers manage own rides"
  on public.rides for all
  using (auth.uid() = driver_id);

create policy "Ride stops viewable by all"
  on public.ride_stops for select
  using (true);

create policy "Drivers manage own ride stops"
  on public.ride_stops for all
  using (exists (
    select 1 from public.rides r
    where r.id = ride_stops.ride_id and r.driver_id = auth.uid()
  ));

-- 4. Bookings Policies
create policy "Bookings viewable by participant"
  on public.bookings for select
  using (
    auth.uid() = passenger_id or
    auth.uid() in (select driver_id from public.rides where id = bookings.ride_id)
  );

create policy "Passengers can create bookings"
  on public.bookings for insert
  with check (auth.uid() = passenger_id);

create policy "Participants can update booking status"
  on public.bookings for update
  using (
    auth.uid() = passenger_id or
    auth.uid() in (select driver_id from public.rides where id = bookings.ride_id)
  );

-- 5. Ride Alerts Policies
create policy "Alerts viewable by owner"
  on public.ride_alerts for select
  using (email = auth.email());

create policy "Anyone can subscribe to ride alerts"
  on public.ride_alerts for insert
  with check (true);

-- 6. Messages Policies (Ride coordination)
create policy "Messages viewable by booking participants"
  on public.messages for select
  using (
    exists (
      select 1 from public.bookings b
      left join public.rides r on r.id = b.ride_id
      where b.id = messages.booking_id
        and (b.passenger_id = auth.uid() or r.driver_id = auth.uid())
    )
  );

create policy "Booking participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.bookings b
      left join public.rides r on r.id = b.ride_id
      where b.id = messages.booking_id
        and (b.passenger_id = auth.uid() or r.driver_id = auth.uid())
    )
  );

-- 7. Double-Blind Ratings Policies (14-day or Mutual reveal)
create policy "Participants can submit rating"
  on public.double_blind_ratings for insert
  with check (auth.uid() = from_user_id);

create policy "Double-blind ratings revealed only after mutual rating or 14 days"
  on public.double_blind_ratings for select
  using (
    -- Author can always see their submitted review
    auth.uid() = from_user_id
    -- Counterparty can only see it if 14 days passed OR both parties rated
    or now() >= (trip_arrival_at + interval '14 days')
    or (
      select count(distinct r2.from_user_id)
      from public.double_blind_ratings r2
      where r2.booking_id = double_blind_ratings.booking_id
    ) >= 2
  );
