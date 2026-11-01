import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWhatsAppCoordinationUrl,
  buildGoogleMapsLandmarkUrl,
  deriveBoardingPin,
  buildSafetyShareText,
  shareTripDetails,
} from '../src/domain/sharing.ts';
import type { Ride } from '../src/domain/matching.ts';
import type { BookingRecord, UserProfile } from '../src/state/types.ts';

test('sharing & navigation domain', async (t) => {
  const dummyRide: Ride = {
    id: 'ride-1',
    driverId: 'driver-1',
    corridorId: 'e01-southern-expressway',
    corridorCode: 'E01',
    corridorName: 'Southern Expressway',
    hasTolls: true,
    tollPolicy: 'included',
    estimatedTollLkr: 400,
    originHubId: 'colombo',
    destinationHubId: 'galle',
    departureDate: '2026-11-05',
    departureAt: '2026-11-05T08:00:00+05:30',
    arrivalAt: '2026-11-05T09:35:00+05:30',
    totalDistanceKm: 116,
    fullPriceLkr: 2500,
    recommendedPriceLkr: 2500,
    totalSeats: 3,
    segmentSeatsAvailable: [3],
    stops: [],
    approvalMode: 'instant',
    boostEnabled: true,
    vehicle: {
      makeModel: 'Toyota Aqua - Silver',
      category: 'car',
      plateHint: 'WP CAH-1234',
      acGuaranteed: true,
    },
    comfort: {
      chattiness: 'blabla',
      maxTwoInBack: true,
      luggage: 'medium',
      music: 'yes',
      pets: 'no',
      smoking: 'no',
      womenOnly: false,
    },
    driver: {
      id: 'driver-1',
      name: 'Ashan Jayawardena',
      phone: '+94 77 234 5678',
      rating: 4.9,
      ratingsCount: 42,
      drivingSkillScore: 2.8,
      completedRides: 42,
      verifiedPhone: true,
      verifiedNic: true,
      verifiedLicence: true,
      isSuperDriver: true,
      responseHours: 1,
    },
    notes: 'No smoking',
    status: 'published',
  };

  const dummyBooking: BookingRecord = {
    id: 'booking-892419',
    rideId: 'ride-1',
    passengerId: 'user-1',
    passengerName: 'Kamal Perera',
    passengerPhone: '+94711112222',
    fromHubId: 'colombo',
    toHubId: 'galle',
    fromIndex: 0,
    toIndex: 1,
    seats: 2,
    unitPriceLkr: 2500,
    totalPriceLkr: 5000,
    isBoostLeg: false,
    settlementMethod: 'cash_lkr',
    status: 'accepted',
    message: 'Looking forward to the ride',
    createdAt: '2026-11-01T10:00:00+05:30',
  };

  const dummyDriver: UserProfile = {
    id: 'driver-1',
    name: 'Ashan Jayawardena',
    email: 'ashan@example.lk',
    phone: '+94 77 234 5678',
    nicNumber: '199012345678',
    licenceNumber: 'B1234567',
    verifiedPhone: true,
    verifiedNic: true,
    verifiedLicence: true,
    hasProfilePhoto: true,
    bio: 'Software engineer & weekend commuter.',
    completedRidesLast12Months: 42,
    overallRating: 4.9,
    ratingsCount: 42,
    drivingSkillScore: 2.8,
    cancellationRatePercent: 0,
    avgResponseHours: 1,
    defaultVehicle: 'Toyota Aqua - Silver',
    comfort: dummyRide.comfort,
  };

  await t.test('normalizes phone number to pure digits in wa.me link', () => {
    const url = buildWhatsAppCoordinationUrl(dummyDriver.phone, dummyRide, dummyBooking, 'Makumbura MMC');
    assert.equal(url.startsWith('https://wa.me/94772345678?text='), true);
    assert.equal(url.includes('Makumbura'), true);
    assert.equal(url.includes('Kamal%20Perera'), true);
  });

  await t.test('normalizes local 07X and 7X phone numbers to 947X for wa.me link', () => {
    const urlFrom0 = buildWhatsAppCoordinationUrl('077 123 4567', dummyRide, dummyBooking, 'Makumbura MMC');
    assert.equal(urlFrom0.startsWith('https://wa.me/94771234567?text='), true);

    const urlFrom7 = buildWhatsAppCoordinationUrl('771234567', dummyRide, dummyBooking, 'Makumbura MMC');
    assert.equal(urlFrom7.startsWith('https://wa.me/94771234567?text='), true);
  });

  await t.test('generates Google Maps coordinate URL when lat/lng are provided', () => {
    const url = buildGoogleMapsLandmarkUrl('Makumbura MMC', 6.8412, 79.9684);
    assert.equal(url, 'https://www.google.com/maps/search/?api=1&query=6.8412%2C79.9684');
  });

  await t.test('generates Google Maps landmark search URL when no coordinates', () => {
    const url = buildGoogleMapsLandmarkUrl('Makumbura MMC');
    assert.equal(url, 'https://www.google.com/maps/search/?api=1&query=Makumbura%20MMC%2C%20Sri%20Lanka');
  });

  await t.test('derives a clean 4-digit boarding pin', () => {
    const pin = deriveBoardingPin('booking-892419');
    assert.equal(pin, '2419');
  });

  await t.test('derives fallback 4-digit boarding pin when id has few digits', () => {
    const pin = deriveBoardingPin('booking-abc');
    assert.equal(pin.length, 4);
  });

  await t.test('builds comprehensive safety share text with driver details and boarding pin', () => {
    const text = buildSafetyShareText(dummyRide, dummyBooking, dummyDriver);
    assert.equal(text.includes('🛡️ Yamu Trip Share:'), true);
    assert.equal(text.includes('Ashan Jayawardena'), true);
    assert.equal(text.includes('Toyota Aqua - Silver'), true);
    assert.equal(text.includes('Boarding PIN: #2419'), true);
  });

  await t.test('shareTripDetails returns cancelled without error on AbortError', async () => {
    const originalNavigator = globalThis.navigator;
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        share: async () => {
          const err = new Error('Share sheet cancelled');
          err.name = 'AbortError';
          throw err;
        },
      },
      configurable: true,
      writable: true,
    });

    const res = await shareTripDetails('Test share');
    assert.equal(res.success, false);
    assert.equal(res.method, 'cancelled');

    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  });

  await t.test('shareTripDetails falls back to clipboard when navigator.share is unavailable', async () => {
    const originalNavigator = globalThis.navigator;
    let copiedText = '';
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        clipboard: {
          writeText: async (text: string) => {
            copiedText = text;
          },
        },
      },
      configurable: true,
      writable: true,
    });

    const res = await shareTripDetails('Safety message for family');
    assert.equal(res.success, true);
    assert.equal(res.method, 'clipboard');
    assert.equal(copiedText, 'Safety message for family');

    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
  });
});
