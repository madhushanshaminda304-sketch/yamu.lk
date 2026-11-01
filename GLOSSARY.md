# BlaBlaCar Sri Lanka (blablacar-lk)

An island-wide intercity carpooling marketplace for Sri Lanka, reverse-engineered from `blablacar.in` and adapted to Sri Lankan road corridors, expressways, cost-sharing regulations, and trilingual (`en-LK`, `si-LK`, `ta-LK`) user expectations.

## Language

### Corridor & Routing

**Hub**:
A recognized Sri Lankan city, town, or expressway interchange (e.g., Makumbura Multimodal Center, Kadawatha Interchange, Kandy Clock Tower, Galle Fort Gate) with canonical coordinates and trilingual names.
_Avoid_: City, station, pin

**Corridor**:
An ordered sequence of Hubs along a Sri Lankan highway or expressway (such as E01 Southern Expressway, A2 Coastal Road, E04 Central Expressway, A1 Kandy Road, or A9 Jaffna Highway) with known cumulative kilometer distances and travel durations.
_Avoid_: Line, path

**Route Option**:
A driver's selected path between origin and destination, distinguishing an **Expressway (Tolls)** route from a **Standard A-Road (No Tolls)** route.
_Avoid_: Highway mode, road type

**Declared Stopover**:
An intermediate Hub along a Corridor where a driver explicitly agrees to pick up or drop off passengers.
_Avoid_: Waypoint, layover, pitstop

**Boost Stopover**:
An algorithmically matched intermediate Hub along the driver's Corridor where a passenger can board or alight for a partial leg of the journey, even if the passenger is not travelling the full origin-to-destination span.
_Avoid_: Sub-trip, partial ride, hop

**Ride Leg**:
A contiguous slice of a published Ride between any two Hubs (`from_stop_index < to_stop_index`) on its Corridor, carrying its own proportional seat availability and LKR contribution.
_Avoid_: Segment, slice

### Pricing & Settlement

**Cost-Sharing Contribution**:
The per-seat amount in Sri Lankan Rupees (`LKR`, stepped by `LKR 50`) calculated from leg distance (~LKR 20/km baseline) and expressway toll rules to reimburse fuel and toll expenses without generating commercial taxi profit.
_Avoid_: Fare, ticket price, tariff, fee

**Contribution Cap**:
The hard maximum LKR amount a driver may set for a Ride Leg (+25% above the recommended Cost-Sharing Contribution) to preserve private carpooling compliance under Sri Lankan law and insurance terms.
_Avoid_: Surge cap, price ceiling

**Price Band**:
The visual classification of a driver's chosen Cost-Sharing Contribution relative to the recommendation: `green` (at or below recommended, fills seats fastest), `amber` (up to +15% above recommended), or `red` (near the Contribution Cap).
_Avoid_: Price tier, discount level

**Onboard Settlement**:
Direct payment by the passenger to the driver at the trip in **Cash (LKR)** or **LankaQR** bank transfer, with zero online payment wall during booking.
_Avoid_: Checkout, escrow, wallet payment

### Booking, Trust & Reputation

**Approval Mode**:
A Ride setting chosen by the driver that governs how seat requests are confirmed: **Instant Booking** (immediate seat reservation upon passenger confirmation) or **Manual Request** (pending until driver accepts within the response window).
_Avoid_: Booking type, auto-accept

**Ride Alert**:
A passenger subscription for a specific origin Hub, destination Hub, and travel date that triggers an instant notification when a matching Ride or Boost Stopover is published.
_Avoid_: Watchlist, saved search

**Verified Profile**:
A member who has completed `+94` mobile OTP/WhatsApp verification, email verification, and Sri Lankan Govt ID verification (**NIC** in 9-digit `V/X` or 12-digit format, plus **Driving Licence** for drivers).
_Avoid_: Approved user, KYC user

**Super Driver**:
An automatic reliability badge awarded to drivers who hold a Verified Profile, have completed ≥3 Rides in the past 12 months, maintain a ≥4.7 overall rating, ≥2.8 driving skill score, <5% cancellation rate, and <3-hour average response time.
_Avoid_: Pro driver, VIP driver, gold member

**Double-Blind Rating**:
A post-trip mutual review (1–5 overall stars + written review, plus an anonymous 1–3 Driving Skill score of `Poor`, `Average`, or `Excellent`) that remains hidden until both participants submit their review or the 14-day window expires.
_Avoid_: Comment, public feedback

**Comfort Profile**:
The combination of vehicle and cabin rules attached to a Ride or Member: **Chattiness** (`Bla` quiet, `BlaBla` mood-dependent, `BlaBlaBla` loves to chat), **Max. 2 in the back**, **AC Guaranteed**, **Luggage Allowance** (`Small`, `Medium`, `Large`), **Music**, **Pets**, **Smoking**, and **Women Only** (`ladies_only`).
_Avoid_: Amenities, perks
