import test from 'node:test';
import assert from 'node:assert/strict';
import { t, DICTIONARY, type LocaleCode } from '../src/domain/i18n.ts';

test('i18n dictionary parity across en-LK, si-LK, and ta-LK', () => {
  const enKeys = Object.keys(DICTIONARY['en-LK']).sort();
  const siKeys = Object.keys(DICTIONARY['si-LK']).sort();
  const taKeys = Object.keys(DICTIONARY['ta-LK']).sort();

  // Every en-LK key must exist in si-LK
  for (const key of enKeys) {
    assert.ok(
      DICTIONARY['si-LK'][key] && DICTIONARY['si-LK'][key].trim().length > 0,
      `Key "${key}" is missing or empty in si-LK`
    );
  }

  // Every en-LK key must exist in ta-LK
  for (const key of enKeys) {
    assert.ok(
      DICTIONARY['ta-LK'][key] && DICTIONARY['ta-LK'][key].trim().length > 0,
      `Key "${key}" is missing or empty in ta-LK`
    );
  }

  assert.equal(siKeys.length, enKeys.length);
  assert.equal(taKeys.length, enKeys.length);
});

test('i18n includes key commuter convenience touchpoints', () => {
  const requiredKeys = [
    'ridepass.title',
    'ridepass.pin',
    'ridepass.driver',
    'ridepass.whatsapp',
    'ridepass.safety_share',
    'luggage.title',
    'luggage.backpack',
    'luggage.medium',
    'luggage.large',
    'publish.return_trip',
    'booking.seats_needed',
    'booking.confirm',
    'nav.offer_ride',
    'nav.requests',
    'calculator.title',
    'requests.title',
    'commute.title',
    'filter.pickup_precision',
    'filter.interchange_only',
    'compare.title',
    'compare.antiscam',
  ];

  for (const key of requiredKeys) {
    assert.ok(t('en-LK', key) !== key, `en-LK missing required key: ${key}`);
    assert.ok(t('si-LK', key) !== key, `si-LK missing required key: ${key}`);
    assert.ok(t('ta-LK', key) !== key, `ta-LK missing required key: ${key}`);
  }
});

test('i18n t() falls back gracefully for unknown keys', () => {
  const nonExistent = 'this.key.does.not.exist';
  assert.equal(t('si-LK', nonExistent), nonExistent);
  assert.equal(t('ta-LK', nonExistent), nonExistent);
  assert.equal(t('en-LK', nonExistent), nonExistent);
});
