import test from 'node:test';
import assert from 'node:assert/strict';
import { createMarketplaceStore } from '../src/state/store.ts';

test('store supports guest booking and driver journey status lifecycle', async (t) => {
  const store = createMarketplaceStore();
  const state = store.getState();
  const testRide = state.rides[0];
  assert.ok(testRide, 'Initial state should contain at least one ride');

  // Request & verify phone OTP for test user
  const otpRes = store.requestPhoneOtp('+94771234567');
  assert.equal(otpRes.ok, true);
  if (otpRes.code) {
    const vRes = store.verifyPhoneOtp(otpRes.code);
    if (vRes.isNewUser) {
      store.completeRegistration('Sunil Perera');
    }
  }

  await t.test('books a seat on behalf of a guest passenger', () => {
    const booking = store.bookRideLeg({
      rideId: testRide.id,
      fromHubId: testRide.stops[0].hubId,
      toHubId: testRide.stops[testRide.stops.length - 1].hubId,
      seats: 1,
      settlementMethod: 'cash_lkr',
      message: 'Booking for my mother',
      isBookingForOther: true,
      guestPassengerName: 'Kamala Perera',
      guestPassengerPhone: '+94712345678',
    });

    assert.ok(booking);
    assert.equal(booking.passengerName, 'Kamala Perera');
    assert.equal(booking.passengerPhone, '+94712345678');
    assert.equal(booking.isBookingForOther, true);
    assert.equal(booking.bookerName, 'Sunil Perera');
  });

  await t.test('driver updates journeyStatus to departed and notifies passengers', () => {
    const res = store.updateRideJourneyStatus(testRide.id, 'departed');
    assert.equal(res.success, true);

    const updatedRide = store.getState().rides.find((r) => r.id === testRide.id);
    assert.equal(updatedRide?.journeyStatus, 'departed');

    const notifs = store.getState().notifications;
    const journeyNotif = notifs.find((n) => n.title.includes('Departed') || n.title.includes('En Route'));
    assert.ok(journeyNotif, 'Should dispatch journey departure notification to passengers');
  });
});
