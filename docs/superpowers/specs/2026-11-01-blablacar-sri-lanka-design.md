# BlaBlaCar Sri Lanka (`blablacar-lk`) — Reverse-Engineered Design Specification

## 1. Intent & Why
Reverse-engineer the production marketplace mechanics, user flows, and Kairos design language of `https://www.blablacar.in/` (backed by REA browser scenario captures `ev_faa35ed9149c4e1e2735339e0527e7da39ed55322b2e2ee48925c98c2294e453` and `ev_572a326ab460582a4ff01eb72386af88213faca6dcb1f24667e847a4dff32004`) and re-architect them into a standalone, production-grade **Sri Lankan intercity carpooling platform** (`blablacar-lk`).

In Sri Lanka, intercity commuters travel heavily along radial highway and expressway corridors (E01 Southern Expressway, E02 Outer Circular, E03 Katunayake, E04 Central Expressway, A1 Colombo–Kandy, A2 Coastal, A9 Jaffna, A4/A6 East). By combining BlaBlaCar.in's **Corridor + Boost Stopover matching**, **distance-capped cost-sharing in LKR**, **Instant vs. Manual Request booking**, **Super Driver & Sri Lankan NIC verification**, and **trilingual (`EN / සිං / தமிழ்`) UI**, the platform delivers a true Sri Lankan BlaBlaCar experience.

## 2. Goals, Non-Goals & Anti-Goals
### Goals
- **Sri Lankan Corridor & Boost Stopover Graph**: 28+ Sri Lankan Hubs across all provinces (including expressway interchanges like *Makumbura Multimodal Center*, *Kottawa*, *Kadawatha*, *Pinnaduwa/Galle*, *Godagama/Matara*, *Peradeniya*, *Kandy*, *Kurunegala*, *Anuradhapura*, *Jaffna*, *Negombo*, *Katunayake Airport*, *Ella*, *Nuwara Eliya*, *Trincomalee*) with multi-segment seat tracking and automatic Boost partial-leg matching.
- **Distance-Anchored LKR Cost-Sharing Engine**: Automatic calculation of recommended per-seat contribution (`~LKR 20/km` rounded to nearest `LKR 50`), expressway toll policy (`Included in contribution`, `Split at toll gate`, `No tolls / A-Road`), and a hard `+25%` Contribution Cap (`green`, `amber`, `red` Price Bands) so rides remain non-commercial cost-sharing.
- **Conversational Multi-Step Publish Wizard**: Matches `blablacar.in`'s exact step sequence (`publish.step.*`): Origin/Destination & Meeting Points → Route Option (Expressway Tolls vs A-Road) & Declared/Boost Stopovers → Departure Date, Time & Optional Return Ride → Seat Count & *"Max. 2 in the back"* comfort toggle → Recommended LKR Price Stepper (`± LKR 50`) → Approval Mode (*Instant Booking* vs *Manual Approval*) & Comment.
- **BlaBlaCar.in Search, Smart Tags & Ride Alerts**:
  - Smart Badges on Ride Cards: `Cheapest`, `Earliest`, `Fastest`, `Cheapest and earliest`, `Boost Stopover`.
  - Rich Filters: Sort (`Earliest departure`, `Lowest price`, `Shortest duration`), Departure time buckets (`Before 06:00`, `06:00–12:00`, `12:01–18:00`, `After 18:00`), Trust & Comfort (`Instant Booking`, `Super Driver`, `Verified Profile`, `Max. 2 in the back`, `Women Only`, `Pets allowed`, `AC Guaranteed`).
  - **Ride Alerts**: 1-click alert subscription when a passenger searches an unserved date/corridor (`search.create_alert`).
- **Sri Lankan Trust, Verification & Double-Blind Ratings**:
  - Sri Lankan NIC validator (`^[0-9]{9}[vVxX]$` and `^[0-9]{12}$`), Driving Licence check, and `+94 7X XXX XXXX` mobile OTP/WhatsApp verification.
  - Automatic **Super Driver** calculation (Verified Profile + ≥3 completed rides + ≥4.7 rating + ≥2.8 driving skill + <5% cancellation + <3h response time).
  - **Comfort Profile**: Chattiness (`Bla`, `BlaBla`, `BlaBlaBla`), Music, Pets, Smoking, AC, Luggage size, Women Only.
  - **14-Day Double-Blind Ratings**: Overall 1–5 rating + text review + anonymous Driving Skill rating (`Poor`, `Average`, `Excellent`).
- **Onboard Cash / LankaQR Settlement & Anti-Scam Chat**:
  - In-app messaging between passenger and driver with automatic **Anti-Scam Link Blocker** (`fight_scams.v2.disclaimer.onboard`: blocks external payment URLs/UPI/card phishing links).
  - Direct WhatsApp (`wa.me/94...`) & tel handoff and Cash / LankaQR onboard settlement indicator.
- **Trilingual (`en-LK`, `si-LK`, `ta-LK`) Support**: Live header switcher for English, Sinhala, and Tamil.

### Non-Goals
- Commercial ride-hailing (no on-demand tuk-tuk/taxi meter dispatch or live GPS driver tracking).
- Online card payment escrow (follows `blablacar.in`'s zero-commission onboard settlement model).

### Anti-Goals
- Never allow profit-seeking commercial taxi pricing above the Contribution Cap.
- Never allow overbooking on overlapping corridor segments when multiple partial-leg passengers book the same ride.

## 3. Approaches Considered
1. **Approach A (Selected): Standalone Modular React 19 + TypeScript + Vite Application with Dual-Mode Repository (Deterministic Local Persistence + Supabase PostgreSQL Schema/RPCs)**
   - *Trade-offs*: Gives a 100% self-contained, immediately runnable and testable application in `c:\Users\DELL\Downloads\blabla new\blablacar-lk` with rich pre-seeded Sri Lankan corridors, drivers, and rides, while also shipping a complete `supabase/schema.sql` migration for cloud deployment.
2. **Approach B: Cloud-Only Backend without Local Repository Adapter**
   - *Trade-offs*: Requires live remote credentials before any search, booking, or rating test can execute locally; rejected in favor of Approach A's clean repository seam.
3. **Approach C: Monolithic Single-File Component**
   - *Trade-offs*: Hard to test and maintain; rejected in favor of deep domain modules (`corridors.ts`, `pricing.ts`, `matching.ts`, `trust.ts`, `scamGuard.ts`, `i18n.ts`, `store.ts`).

## 4. Architecture & Module Design
- `src/domain/corridors.ts`: Sri Lankan Hub catalog (28 hubs with `en`, `si`, `ta` names, district, landmark meeting points, coordinates) and Highway/Expressway Corridor definitions (`E01`, `A2`, `E04/A1`, `E03/A3`, `A9`, `A6`), route option calculator (Expressway Toll vs Standard A-Road), and intermediate stopover resolver.
- `src/domain/pricing.ts`: Distance-based LKR cost-sharing calculator (`calculateRecommendedLkr`, `getContributionBounds`, `getPriceBand`, `calculateLegContribution`, `stepContributionLkr`).
- `src/domain/matching.ts`: Corridor segment capacity engine (`buildSegments`, `canBookLeg`, `applyLegBooking`, `releaseLegBooking`), search filter & smart-tag engine (`assignSmartTags`: `Cheapest`, `Earliest`, `Fastest`, `Boost`), and Boost partial-leg matcher.
- `src/domain/trust.ts`: Sri Lankan NIC (`9-digit V/X` & `12-digit`) and `+947XXXXXXXX` mobile validator, Super Driver badge evaluator (`evaluateSuperDriver`), and 14-day Double-Blind Rating visibility resolver (`resolveRatingVisibility`).
- `src/domain/scamGuard.ts`: BlaBlaCar anti-scam message inspector (`inspectChatMessage`) that detects external payment links, card numbers, or advance-transfer solicitation and warns/blocks per `fight_scams.v2`.
- `src/domain/i18n.ts`: Trilingual dictionary (`en-LK`, `si-LK`, `ta-LK`) and `LKR` currency/time formatters (`Asia/Colombo`).
- `src/state/store.ts`: Immutable state store with `localStorage` persistence and seeded Sri Lankan marketplace data (rides with stopovers, Super Drivers, bookings, ride alerts, messages, double-blind ratings).
- `src/App.tsx` & `src/styles.css`: Kairos-inspired BlaBlaCar Sri Lanka UI (Hero search bar with Hub autocomplete & swap, Results page with sidebar filters + smart tags + Boost stopover timeline + Ride Alert creation, Ride Detail page with full stopover itinerary + driver verification/Super Driver/comfort badges + scam disclaimer, 6-step Conversational Publish Wizard with interactive LKR stepper & Price Band pill, My Rides & Bookings with Instant/Manual approval + Anti-Scam Chat + Double-Blind Rating modal, Profile & Sri Lankan NIC/Phone Verification hub).
- `supabase/schema.sql`: Complete PostgreSQL schema for hubs, rides, ride_stops, bookings, ride_alerts, messages, and double_blind_ratings.
