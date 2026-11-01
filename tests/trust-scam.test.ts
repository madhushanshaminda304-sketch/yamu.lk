import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateSriLankaPhone,
  validateSriLankaNic,
  evaluateSuperDriver,
  resolveRatingVisibility,
} from '../src/domain/trust.ts';
import { inspectChatMessage } from '../src/domain/scamGuard.ts';
import { t, formatLkr } from '../src/domain/i18n.ts';

test('Sri Lankan NIC and +94 mobile validation accepts valid old/new NICs and rejects invalid formats', () => {
  assert.equal(validateSriLankaPhone('+94771234567'), true);
  assert.equal(validateSriLankaPhone('0771234567'), false);

  const oldNic = validateSriLankaNic('921451234V');
  assert.equal(oldNic.valid, true);
  assert.equal(oldNic.format, 'old_9_vx');
  assert.equal(oldNic.birthYear, 1992);

  const newNic = validateSriLankaNic('199823401234');
  assert.equal(newNic.valid, true);
  assert.equal(newNic.format, 'new_12');
  assert.equal(newNic.birthYear, 1998);

  assert.equal(validateSriLankaNic('12345').valid, false);
});

test('Super Driver evaluation enforces BlaBlaCar 6-point criteria and Double-Blind rating visibility', () => {
  const superCheck = evaluateSuperDriver({
    verifiedPhone: true,
    verifiedNic: true,
    verifiedLicence: true,
    hasProfilePhoto: true,
    completedRidesLast12Months: 5,
    overallRating: 4.85,
    drivingSkillScore: 2.9,
    cancellationRatePercent: 2.0,
    avgResponseHours: 1.2,
  });
  assert.equal(superCheck.isSuperDriver, true);
  assert.equal(superCheck.unmetCriteria.length, 0);

  const nonSuper = evaluateSuperDriver({
    verifiedPhone: true,
    verifiedNic: false,
    verifiedLicence: true,
    hasProfilePhoto: true,
    completedRidesLast12Months: 2,
    overallRating: 4.5,
    drivingSkillScore: 2.5,
    cancellationRatePercent: 8.0,
    avgResponseHours: 4.5,
  });
  assert.equal(nonSuper.isSuperDriver, false);
  assert.ok(nonSuper.unmetCriteria.length >= 4);

  // Double-blind rating visibility
  const rating = {
    id: 'rat-1',
    bookingId: 'bk-1',
    fromUserId: 'usr-1',
    toUserId: 'drv-1',
    stars: 5,
    drivingSkill: 'excellent' as const,
    comment: 'Smooth E01 highway drive!',
    createdAt: '2026-11-02T12:00:00+05:30',
    tripArrivalAt: '2026-11-02T10:00:00+05:30',
  };

  assert.equal(resolveRatingVisibility(rating, false, '2026-11-05T10:00:00+05:30'), false);
  assert.equal(resolveRatingVisibility(rating, true, '2026-11-02T12:05:00+05:30'), true);
  assert.equal(resolveRatingVisibility(rating, false, '2026-11-17T10:00:00+05:30'), true);
});

test('Anti-scam chat guard blocks external payment URLs and warns on advance transfer solicitation', () => {
  const safe = inspectChatMessage('Hi ayya, I will wait near the Makumbura E01 bay with 1 medium bag.');
  assert.equal(safe.allowed, true);

  const phishing = inspectChatMessage('Please pay advance seat deposit at https://fake-pay-lanka.xyz/book');
  assert.equal(phishing.allowed, false);
  assert.equal(phishing.warningCode, 'external_link_blocked');

  const cardSolicit = inspectChatMessage('Send your CVV and card number to confirm seat');
  assert.equal(cardSolicit.allowed, false);
  assert.equal(cardSolicit.warningCode, 'advance_payment_scam_warning');
});

test('Trilingual i18n dictionary translates en-LK, si-LK, and ta-LK and formats LKR', () => {
  assert.ok(t('en-LK', 'hero.title').length > 0);
  assert.ok(t('si-LK', 'hero.title').length > 0);
  assert.ok(t('ta-LK', 'hero.title').length > 0);
  assert.notEqual(t('en-LK', 'hero.title'), t('si-LK', 'hero.title'));
  assert.equal(formatLkr(1850), 'LKR 1,850');
});
