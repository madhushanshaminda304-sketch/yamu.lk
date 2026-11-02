import test from 'node:test';
import assert from 'node:assert/strict';
import { createMarketplaceStore } from '../src/state/store.ts';
import { searchRides, canBookLeg } from '../src/domain/matching.ts';
import { buildWhatsAppCoordinationUrl, buildSafetyShareText } from '../src/domain/sharing.ts';

test('Mobility features: Guest passenger, vehicle categories, quiet ride, and journey lifecycle', async (t) => {
  const store = createMarketplaceStore();
  const testRide = store.getState().rides[0];
  assert.ok(testRide, 'Expected at least one seeded ride');

  // Request & verify phone OTP for test user
  const otpRes = store.requestPhoneOtp('+94773334444');
  assert.equal(otpRes.ok, true);
  if (otpRes.code) {
    const vRes = store.verifyPhoneOtp(otpRes.code);
    if (vRes.isNewUser) {
      store.completeRegistration('Nimal Siriwardena');
    }
  }

  await t.test('guest booking records guest passenger name, phone, and booker identity', () => {
    const booking = store.bookRideLeg({
      rideId: testRide.id,
      fromHubId: testRide.originHubId,
      toHubId: testRide.destinationHubId,
      seats: 2,
      settlementMethod: 'lankaqr',
      message: 'Booking seats for my elderly parents',
      isBookingForOther: true,
      guestPassengerName: 'Chandradasa Siriwardena',
      guestPassengerPhone: '+94719876543',
    });

    assert.equal(booking.passengerName, 'Chandradasa Siriwardena');
    assert.equal(booking.passengerPhone, '+94719876543');
    assert.equal(booking.isBookingForOther, true);
    assert.equal(booking.bookerName, 'Nimal Siriwardena');

    // WhatsApp coordination URL reflects guest passenger details
    const waUrl = buildWhatsAppCoordinationUrl(
      testRide.driver.phone || '+94772345678',
      testRide,
      booking,
      'Main entrance'
    );
    assert.ok(waUrl.includes(encodeURIComponent('Chandradasa Siriwardena')));
    assert.ok(waUrl.includes(encodeURIComponent('Nimal Siriwardena')));

    // Safety share text reflects guest passenger details
    const safetyText = buildSafetyShareText(testRide, booking, {
      ...store.getState().currentUser!,
      name: testRide.driver.name,
      phone: testRide.driver.phone || '+94772345678',
      defaultVehicle: testRide.vehicle.makeModel,
      overallRating: 5.0,
    });
    assert.ok(safetyText.includes('Chandradasa Siriwardena'));
    assert.ok(safetyText.includes('Nimal Siriwardena'));
  });

  await t.test('searchRides filters properly by vehicle category and quiet ride preference', () => {
    const allRides = store.getState().rides;

    const suvRides = searchRides(allRides, {
      fromHubId: 'all',
      toHubId: 'all',
      vehicleCategory: 'suv',
    });
    for (const r of suvRides) {
      assert.equal(r.ride.vehicle.category, 'suv');
    }

    const quietRides = searchRides(allRides, {
      fromHubId: 'all',
      toHubId: 'all',
      quietRideOnly: true,
    });
    for (const r of quietRides) {
      assert.equal(Boolean(r.ride.comfort?.quietRide), true);
    }
  });

  await t.test('driver journey status lifecycle transitions correctly and posts notifications', () => {
    // 1. Departed
    const depRes = store.updateRideJourneyStatus(testRide.id, 'departed');
    assert.equal(depRes.success, true);
    const departedRide = store.getState().rides.find((r) => r.id === testRide.id);
    assert.equal(departedRide?.journeyStatus, 'departed');

    const notifs = store.getState().notifications;
    const enRouteNotif = notifs.find((n) => n.title.includes('Driver En Route') || n.title.includes('Departed'));
    assert.ok(enRouteNotif, 'Should emit en route notification');

    // 2. Completed
    const compRes = store.updateRideJourneyStatus(testRide.id, 'completed');
    assert.equal(compRes.success, true);
    const completedRide = store.getState().rides.find((r) => r.id === testRide.id);
    assert.equal(completedRide?.journeyStatus, 'completed');

    // Completed rides must NOT be bookable or searchable
    const searchMatch = searchRides([completedRide!], {
      fromHubId: completedRide!.originHubId,
      toHubId: completedRide!.destinationHubId,
    });
    assert.equal(searchMatch.length, 0, 'Completed journey should not appear in search results');

    const canBook = canBookLeg(completedRide!, completedRide!.originHubId, completedRide!.destinationHubId, 1);
    assert.equal(canBook.allowed, false, 'Completed journey should not allow new bookings');
    assert.ok(canBook.reason?.includes('completed'));
  });
});
