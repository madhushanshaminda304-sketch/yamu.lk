# 0003: Frictionless Publishing with Tiered Sri Lankan Verification & Super Driver

Status: accepted

Rather than blocking every new driver behind a manual administrator phone call before they can publish a ride, we adopt `blablacar.in`'s marketplace trust architecture adapted for Sri Lanka:
1. **Verified Profile** combines `+94 7X XXX XXXX` mobile OTP/WhatsApp verification, email verification, and Sri Lankan **NIC** (`^[0-9]{9}[vVxX]$` or `^[0-9]{12}$`) / **Driving Licence** verification.
2. **Super Driver** status is computed automatically from objective reliability criteria (Verified Profile, ≥3 completed rides, ≥4.7 star average, ≥2.8 driving skill score, <5% cancellation rate, <3h response time).
3. **Anti-Scam & Onboard Settlement**: All rides settle directly onboard via **Cash (LKR)** or **LankaQR**, and the in-app messaging system blocks external payment/phishing links (`fight_scams.v2.disclaimer.onboard`).
