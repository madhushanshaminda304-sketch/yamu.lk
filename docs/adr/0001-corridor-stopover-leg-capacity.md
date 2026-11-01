# 0001: Corridor & Stopover Graph with Proportional Leg Capacity

Status: accepted

In `blablacar.in`, drivers publish an intercity ride (e.g., Delhi → Chandigarh) and either declare intermediate stopovers or let **Boost** match passengers travelling along intermediate towns on the same highway. A simple `origin = X AND destination = Y` table query fails in Sri Lanka because most intercity demand runs along shared trunk corridors (e.g., a driver going `Colombo (Makumbura) → Matara` via E01 passes `Kottawa`, `Dodangoda`, `Kurundugahahetekma`, and `Galle (Pinnaduwa)`; a driver going `Colombo → Kandy` via A1/E04 passes `Kadawatha`, `Kegalle`, `Mawanella`, and `Peradeniya`).

We model every published ride with an ordered `ride_stops` array (`stop_index`, `hub_id`, `arrival_at`, ` cumulative_km`, `price_from_origin_lkr`, `is_boost_stop`). Seat availability is tracked per contiguous segment (`segment_index` from `stop_i` to `stop_{i+1}`), so booking a partial leg (`Colombo → Galle` on a `Colombo → Matara` ride) decrements seats only on the overlapping segments, allowing another passenger to book `Galle → Matara` on the same seat.
