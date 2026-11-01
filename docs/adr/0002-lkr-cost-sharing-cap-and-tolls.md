# 0002: Distance-Anchored LKR Cost-Sharing Cap & Toll Policy

Status: accepted

To mirror `blablacar.in` (`trip_edit_prices.disclaimer.max_price`: *"Our community spirit is all about cost-sharing, not making money. This is why all rides have a max price limit"*) and keep private carpooling distinct from commercial taxi/three-wheeler operations under Sri Lankan law and private motor insurance, drivers cannot set arbitrary profit-making fares.

We compute a deterministic **Recommended Cost-Sharing Contribution** in `LKR` from route distance (`roundTo50(distance_km * 20)` LKR per seat, reflecting ~LKR 300+/L fuel divided across shared occupancy) plus an explicit **Expressway Toll Policy** (`included_in_price` vs `split_at_gate` vs `no_tolls`). Drivers can adjust the contribution in `LKR 50` steps between `75%` (floor) and `125%` (hard **Contribution Cap**) of the recommendation, with real-time `green` / `amber` / `red` price-band feedback.
