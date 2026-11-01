# Supabase Cloud Database & Multi-User Sync Design

- **Date**: 2026-11-01
- **Status**: Proposed
- **Author**: Antigravity & Engineering Team
- **Target Platform**: `blablacar-lk` (React 19 + TypeScript + Supabase)
- **Supabase Project**: `https://ykjmjwlvucbzmgfdyjfd.supabase.co`

---

## 1. Intent & Context

Yamu is now live at `https://yamu-lk.madhushanshaminda304.workers.dev/`. However, rides and bookings were previously stored purely in client-side memory (`MarketplaceStore`). When Driver A publishes a ride on their phone, Passenger B visiting from another phone cannot see it without a shared cloud database.

This design introduces **Supabase PostgreSQL** as the persistent cloud backend, enabling real-time intercity carpooling between real devices while maintaining local offline resilience.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Multi-Device Synchronization**: Published rides, seat bookings, and driver profiles persist in Supabase PostgreSQL and appear across all visiting devices.
- **Graceful Offline Fallback**: If Supabase credentials are missing or the user is offline, the app continues to operate seamlessly using local in-memory/seed data without throwing uncaught runtime errors.
- **Data Parity with Domain Models**: Table schemas match Yamu's rich domain models (`Ride`, `BookingRecord`, `UserProfile`, `LuggageCapacity`, `SettlementMethod`).
- **Security & RLS**: Provide Row-Level Security policies allowing public read of rides and secure creation of bookings.

### Non-Goals
- Credit card payment processing (settlement remains strictly fair cost-sharing onboard via Cash LKR or LankaQR).
- Overhauling existing tested domain logic (`matching.ts`, `pricing.ts`, `corridors.ts`, `sharing.ts`).

### Anti-Goals
- Storing secrets or administrative service_role keys on the frontend.
- Breaking the 34 passing automated tests.

---

## 3. Database Schema (`supabase/migrations/01_initial_schema.sql`)

### Table 1: `profiles`
Stores verified Sri Lankan commuters and drivers.
- `id` (text, primary key) — Phone number (e.g. `+94772345678`) or user ID.
- `name` (text, not null)
- `phone` (text, not null, unique)
- `nic_number` (text)
- `licence_number` (text)
- `verified_phone` (boolean default false)
- `verified_nic` (boolean default false)
- `verified_licence` (boolean default false)
- `is_super_driver` (boolean default false)
- `overall_rating` (numeric default 5.0)
- `ratings_count` (int default 0)
- `default_vehicle` (text)
- `created_at` (timestamptz default now())

### Table 2: `rides`
Stores published carpool journeys along Sri Lankan corridors.
- `id` (text, primary key) — e.g. `ride-colombo-galle-xxx`
- `driver_id` (text, references profiles(id))
- `origin_hub_id` (text, not null)
- `destination_hub_id` (text, not null)
- `corridor_id` (text, not null)
- `corridor_code` (text, not null)
- `departure_date` (text, not null)
- `departure_time` (text, not null)
- `departure_at` (timestamptz, not null)
- `return_ride_id` (text)
- `total_seats` (int not null)
- `available_seats` (int not null)
- `full_price_lkr` (numeric not null)
- `approval_mode` (text not null) — `'instant'` | `'manual'`
- `luggage_capacity` (text not null) — `'small'` | `'medium'` | `'large'`
- `has_tolls` (boolean not null default false)
- `driver` (jsonb not null) — Driver profile snapshot (name, rating, phone, badges)
- `vehicle` (jsonb not null) — Make, model, license plate, AC
- `comfort` (jsonb not null) — Luggage, max 2 in back, smoking, pets
- `stops` (jsonb not null) — Array of corridor stops with landmarks and times
- `created_at` (timestamptz default now())

### Table 3: `bookings`
Stores passenger seat reservations and digital boarding passes.
- `id` (text, primary key) — e.g. `bk-xxx`
- `ride_id` (text references rides(id))
- `passenger_id` (text not null)
- `passenger_name` (text not null)
- `passenger_phone` (text not null)
- `from_hub_id` (text not null)
- `to_hub_id` (text not null)
- `from_index` (int not null)
- `to_index` (int not null)
- `seats` (int not null)
- `total_price_lkr` (numeric not null)
- `settlement_method` (text not null) — `'lankaqr'` | `'cash_lkr'`
- `boarding_pin` (text not null) — 4-digit code
- `status` (text not null) — `'pending'` | `'accepted'` | `'declined'` | `'cancelled'`
- `created_at` (timestamptz default now())

---

## 4. Frontend Architecture

### 1. Supabase Client (`src/lib/supabase.ts`)
Initializes the `@supabase/supabase-js` client using:
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ykjmjwlvucbzmgfdyjfd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_0ivNm3eqJ6wOdOE9fQZn9g_dXzPidB0';
```

### 2. Store Integration (`src/state/store.ts` & `src/state/supabaseSync.ts`)
- On application initialization:
  - Fetches existing rides from `rides` table in Supabase.
  - If the database is fresh/empty, automatically seeds standard expressway corridor rides so new users immediately have rides to discover.
- On `publishRide`:
  - Inserts the new ride into Supabase `rides`.
- On `bookRideLeg`:
  - Inserts the new booking into Supabase `bookings` and updates `available_seats` on the ride.

---

## 5. Verification Plan
1. Schema verification: SQL script execution in Supabase SQL editor.
2. Unit tests: Verify Supabase client module handles offline fallback and mapping functions correctly.
3. Integration: Publish a ride and verify it persists in Supabase table via REST API.
4. Clean build: `npm test && npm run build` passes with 0 errors.
