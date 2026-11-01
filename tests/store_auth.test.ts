import test from 'node:test';
import assert from 'node:assert/strict';
import { createMarketplaceStore } from '../src/state/store.ts';

test('Store manages guest state, OTP request, verification, and new user onboarding', () => {
  const store = createMarketplaceStore();
  store.logout(); // Start as guest
  assert.equal(store.getState().currentUser, null);

  // 1. Request OTP for existing driver (+94772345678)
  const reqExisting = store.requestPhoneOtp('0772345678');
  assert.equal(reqExisting.ok, true);
  assert.ok(reqExisting.code);

  // 2. Verify OTP for existing driver
  const verExisting = store.verifyPhoneOtp(reqExisting.code!);
  assert.equal(verExisting.ok, true);
  assert.equal(verExisting.isNewUser, false);
  assert.equal(store.getState().currentUser?.phone, '+94772345678');
  assert.equal(store.getState().currentUser?.verifiedPhone, true);

  // 3. Logout and login new commuter (+94711112222)
  store.logout();
  assert.equal(store.getState().currentUser, null);
  const reqNew = store.requestPhoneOtp('0711112222');
  assert.equal(reqNew.ok, true);
  assert.ok(reqNew.code);

  const verNew = store.verifyPhoneOtp(reqNew.code!);
  assert.equal(verNew.ok, true);
  assert.equal(verNew.isNewUser, true);

  // 4. Complete registration for new commuter
  const regResult = store.completeRegistration('Kavindi Silva', '199854301290');
  assert.equal(regResult.ok, true);
  assert.equal(store.getState().currentUser?.name, 'Kavindi Silva');
  assert.equal(store.getState().currentUser?.phone, '+94711112222');
  assert.equal(store.getState().currentUser?.verifiedPhone, true);
  assert.equal(store.getState().currentUser?.verifiedNic, true);
});

test('Store enforces 60-second resend cooldown on repeated OTP requests', () => {
  const store = createMarketplaceStore();
  const now = 1700000000000;
  const res1 = store.requestPhoneOtp('0771234567', now);
  assert.equal(res1.ok, true);

  // Calling again 10 seconds later must be blocked by cooldown
  const res2 = store.requestPhoneOtp('0771234567', now + 10000);
  assert.equal(res2.ok, false);
  assert.match(res2.error || '', /wait 50 seconds/i);

  // Calling 61 seconds later must succeed
  const res3 = store.requestPhoneOtp('0771234567', now + 61000);
  assert.equal(res3.ok, true);
});
