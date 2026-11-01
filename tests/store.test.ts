import test from 'node:test';
import assert from 'node:assert/strict';
import { createMarketplaceStore } from '../src/state/store.ts';
import { getColomboDateOffset } from '../src/domain/i18n.ts';

test('Marketplace store handles Ride Alerts, Publish Ride, Instant & Manual Bookings, Scam Chat Guard, and Double-Blind Ratings', () => {
  const store = createMarketplaceStore();
  const tomorrow = getColomboDateOffset(1);

  // 1. Create a Ride Alert for Colombo -> Jaffna
  store.createRideAlert({
    fromHubId: 'colombo',
    toHubId: 'jaffna',
    date: tomorrow,
    email: 'traveller@lanka.lk',
  });
  assert.equal(store.getState().rideAlerts.length >= 1, true);

  // 2. Publish a new ride on Colombo -> Jaffna (via Anuradhapura) and verify alert fires a notification
  const prevNotifCount = store.getState().notifications.length;
  const published = store.publishRide({
    originHubId: 'colombo',
    destinationHubId: 'jaffna',
    corridorId: 'e03-airport-northern-a9',
    date: tomorrow,
    departureTime: '05:30',
    pickupLandmark: 'Fort Railway Station Main Entrance',
    dropoffLandmark: 'Jaffna Central Bus Stand / Hospital Road',
    selectedStopoverHubIds: ['katunayake', 'kurunegala', 'anuradhapura', 'vavuniya'],
    boostEnabled: true,
    seats: 3,
    priceLkr: 7500,
    tollPolicy: 'included',
    approvalMode: 'instant',
    vehicleMakeModel: 'Honda Vezel RS Hybrid · Blue',
    vehicleCategory: 'suv',
    acGuaranteed: true,
    comfort: {
      chattiness: 'blabla',
      maxTwoInBack: true,
      luggage: 'large',
      music: 'yes',
      pets: 'no',
      smoking: 'no',
      womenOnly: false,
    },
    notes: 'Heading north via E03 and A9. Short breakfast stop in Kurunegala.',
  });

  assert.ok(published.id);
  assert.ok(store.getState().notifications.length > prevNotifCount);

  // 3. Book a partial Boost leg (Colombo -> Anuradhapura) on that Instant Booking ride
  const bookingRes = store.bookRideLeg({
    rideId: published.id,
    fromHubId: 'colombo',
    toHubId: 'anuradhapura',
    seats: 2,
    settlementMethod: 'lankaqr',
    message: 'Joining from Colombo Fort to Anuradhapura New Town!',
  });

  assert.equal(bookingRes.status, 'accepted');
  assert.equal(bookingRes.isBoostLeg, true);

  // Verify segment capacity was decremented on Colombo -> Anuradhapura but Anuradhapura -> Jaffna still has 3 seats
  const updatedRide = store.getState().rides.find((r) => r.id === published.id)!;
  assert.equal(updatedRide.segmentSeatsAvailable[0], 1); // Colombo -> Katunayake
  assert.equal(updatedRide.segmentSeatsAvailable[updatedRide.segmentSeatsAvailable.length - 1], 3); // Vavuniya -> Jaffna

  // 4. Send chat message — scam URL is blocked, normal message succeeds
  const blockedChat = store.sendMessage(bookingRes.id, 'Pay advance at https://scam-pay.lk/now');
  assert.equal(blockedChat.allowed, false);

  const validChat = store.sendMessage(bookingRes.id, 'See you at 5:20 AM at Fort main entrance!');
  assert.equal(validChat.allowed, true);

  // 5. Submit Double-Blind Rating — hidden until counterparty also rates
  const passengerUserId = 'usr-passenger-2';
  store.submitDoubleBlindRating({
    bookingId: bookingRes.id,
    fromUserId: passengerUserId,
    toUserId: updatedRide.driverId,
    stars: 5,
    drivingSkill: 'excellent',
    comment: 'Super smooth drive to Anuradhapura!',
  });

  const ratingsBefore = store.getVisibleRatingsForBooking(bookingRes.id);
  assert.equal(ratingsBefore.length, 0);

  // Counterparty (driver) submits their rating -> both unlock immediately!
  store.submitDoubleBlindRating({
    bookingId: bookingRes.id,
    fromUserId: updatedRide.driverId,
    toUserId: passengerUserId,
    stars: 5,
    comment: 'Punctual and friendly passenger.',
  });

  const ratingsAfter = store.getVisibleRatingsForBooking(bookingRes.id);
  assert.equal(ratingsAfter.length, 2);
});
