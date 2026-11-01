import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeSriLankanMobile,
  createOtpChallenge,
  verifyOtpCode,
} from '../src/domain/auth.ts';

test('normalizeSriLankanMobile validates and formats local, 0-prefixed, and international numbers', () => {
  assert.deepEqual(normalizeSriLankanMobile('0771234567'), { valid: true, phone: '+94771234567' });
  assert.deepEqual(normalizeSriLankanMobile('+94 71 987 6543'), { valid: true, phone: '+94719876543' });
  assert.deepEqual(normalizeSriLankanMobile('761122334'), { valid: true, phone: '+94761122334' });
  assert.equal(normalizeSriLankanMobile('0112345678').valid, false); // Colombo landline rejected
  assert.equal(normalizeSriLankanMobile('12345').valid, false);
  assert.equal(normalizeSriLankanMobile('').valid, false);
});

test('createOtpChallenge generates 6-digit code with 5-minute expiry and 60s resend cooldown', () => {
  const now = 1700000000000;
  const challenge = createOtpChallenge('+94771234567', now);
  assert.equal(challenge.phone, '+94771234567');
  assert.match(challenge.code, /^[0-9]{6}$/);
  assert.equal(challenge.expiresAt, now + 5 * 60 * 1000);
  assert.equal(challenge.resendAvailableAt, now + 60 * 1000);
  assert.equal(challenge.attemptsRemaining, 3);
});

test('verifyOtpCode succeeds on valid code, fails on wrong code, and tracks attempts/expiry', () => {
  const now = 1700000000000;
  const challenge = createOtpChallenge('+94771234567', now);

  // 1. Wrong code (attempt 1)
  const r1 = verifyOtpCode(challenge, '000000', now);
  assert.equal(r1.ok, false);
  assert.equal(r1.updatedChallenge.attemptsRemaining, 2);

  // 2. Wrong code (attempt 2)
  const r2 = verifyOtpCode(r1.updatedChallenge, '111111', now);
  assert.equal(r2.ok, false);
  assert.equal(r2.updatedChallenge.attemptsRemaining, 1);

  // 3. Expired code
  const rExpired = verifyOtpCode(challenge, challenge.code, now + 301 * 1000);
  assert.equal(rExpired.ok, false);
  assert.equal(rExpired.expired, true);

  // 4. Correct code on r2
  const rSuccess = verifyOtpCode(r2.updatedChallenge, challenge.code, now);
  assert.equal(rSuccess.ok, true);
  assert.equal(rSuccess.updatedChallenge.isVerified, true);

  // 5. Exhausted attempts: 3rd wrong code must exhaust challenge
  const r3 = verifyOtpCode(r2.updatedChallenge, '222222', now);
  assert.equal(r3.ok, false);
  assert.equal(r3.updatedChallenge.attemptsRemaining, 0);
  assert.equal(r3.exhausted, true);

  // Subsequent verification attempts on exhausted challenge must fail
  const rPostExhaust = verifyOtpCode(r3.updatedChallenge, challenge.code, now);
  assert.equal(rPostExhaust.ok, false);
  assert.equal(rPostExhaust.exhausted, true);
});
