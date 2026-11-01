import { getHubById } from './corridors.ts';
import type { Ride } from './matching.ts';
import type { BookingRecord, UserProfile } from '../state/types.ts';

export function normalizeWhatsAppPhone(phone: string): string {
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = `94${clean.slice(1)}`;
  } else if (!clean.startsWith('94') && clean.length === 9) {
    clean = `94${clean}`;
  }
  return clean;
}

export function deriveBoardingPin(bookingId: string): string {
  const digits = bookingId.replace(/\D/g, '');
  if (digits.length >= 4) {
    return digits.slice(-4);
  }
  // Deterministic 4-digit fallback from string char codes
  let hash = 0;
  for (let i = 0; i < bookingId.length; i++) {
    hash = (hash * 31 + bookingId.charCodeAt(i)) % 10000;
  }
  return String(Math.abs(hash)).padStart(4, '7');
}

export function buildWhatsAppCoordinationUrl(
  driverPhone: string,
  ride: Ride,
  booking: BookingRecord,
  pickupLandmark: string
): string {
  const cleanPhone = normalizeWhatsAppPhone(driverPhone);
  const fromHub = getHubById(booking.fromHubId);
  const toHub = getHubById(booking.toHubId);
  const fromName = fromHub?.name.en ?? booking.fromHubId;
  const toName = toHub?.name.en ?? booking.toHubId;

  const timeFormatted = ride.departureAt.includes('T')
    ? ride.departureAt.split('T')[1].slice(0, 5)
    : ride.departureAt;

  const message =
    `Hi ${ride.driver.name}, I booked ${booking.seats} seat(s) on Yamu for your trip from ${fromName} to ${toName} ` +
    `departing at ${timeFormatted}. My pickup point is ${pickupLandmark}. ` +
    `Passenger: ${booking.passengerName}. Looking forward to the ride!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function buildGoogleMapsLandmarkUrl(
  landmarkName: string,
  hubLat?: number,
  hubLng?: number
): string {
  if (typeof hubLat === 'number' && typeof hubLng === 'number') {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hubLat},${hubLng}`)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${landmarkName}, Sri Lanka`)}`;
}

export function buildSafetyShareText(
  ride: Ride,
  booking: BookingRecord,
  driver: UserProfile
): string {
  const fromHub = getHubById(booking.fromHubId);
  const toHub = getHubById(booking.toHubId);
  const fromName = fromHub?.name.en ?? booking.fromHubId;
  const toName = toHub?.name.en ?? booking.toHubId;
  const pin = deriveBoardingPin(booking.id);
  const vehicle = driver.defaultVehicle || ride.vehicle.makeModel || 'Personal Vehicle';
  const ratingText = driver.overallRating > 0 ? `${driver.overallRating.toFixed(1)}★` : 'New Driver';

  return (
    `🛡️ Yamu Trip Share:\n` +
    `I am traveling from ${fromName} to ${toName} with driver ${driver.name} (${ratingText}, ${vehicle}).\n` +
    `Scheduled departure: ${ride.departureAt}\n` +
    `Driver contact: ${driver.phone}\n` +
    `Boarding PIN: #${pin}\n` +
    `Shared via Yamu (yamu.lk)`
  );
}

export async function shareTripDetails(
  text: string
): Promise<{ success: boolean; method: 'native' | 'clipboard' | 'cancelled' }> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: 'Yamu Trip Share',
        text,
      });
      return { success: true, method: 'native' };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: false, method: 'cancelled' };
      }
      // Continue to clipboard fallback on non-abort errors
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true, method: 'clipboard' };
    } catch {
      // ignore
    }
  }

  return { success: false, method: 'clipboard' };
}
