import test from 'node:test';
import assert from 'node:assert/strict';
import {
  t,
  DICTIONARY,
  SUPPORTED_LOCALES,
  LOCALE_META,
  isValidLocale,
  getValidLocale,
  type LocaleCode,
} from '../src/domain/i18n.ts';
import { HUBS, getHubDisplayName } from '../src/domain/corridors.ts';

test('i18n dictionary parity across English, Sinhala and Tamil', () => {
  const keys = Object.keys(DICTIONARY['en-LK']).sort();
  for (const locale of SUPPORTED_LOCALES) {
    assert.deepEqual(Object.keys(DICTIONARY[locale]).sort(), keys);
    for (const key of keys) assert.ok(DICTIONARY[locale][key].trim(), locale + ': ' + key);
  }
});

test('i18n includes key commuter convenience touchpoints and toast notifications across all 3 locales', () => {
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
    'toast.booking_confirmed',
    'toast.alert_created',
    'toast.publish_success',
  ];

  for (const loc of SUPPORTED_LOCALES) {
    for (const key of requiredKeys) {
      assert.ok(t(loc, key) !== key, `${loc} missing required key: ${key}`);
      assert.ok(t(loc, key).trim().length > 0, `${loc} empty key: ${key}`);
    }
  }
});

test('i18n locale helpers and metadata', () => {
  assert.equal(SUPPORTED_LOCALES.length, 3);
  assert.ok(!isValidLocale('ru-RU'));
  assert.ok(isValidLocale('en-LK'));
  assert.ok(!isValidLocale('fr-FR'));

  assert.equal(getValidLocale('ru-RU'), 'en-LK');
  assert.equal(getValidLocale('ru'), 'en-LK');
  assert.equal(getValidLocale('si'), 'si-LK');
  assert.equal(getValidLocale('ta'), 'ta-LK');
  assert.equal(getValidLocale(null), 'en-LK');
  assert.equal(getValidLocale('invalid'), 'en-LK');

  assert.equal(LOCALE_META['en-LK'].label, 'EN');
  assert.equal(LOCALE_META['si-LK'].label, 'සිං');
  assert.equal(LOCALE_META['ta-LK'].label, 'தமிழ்');
});

test('i18n t() parameter interpolation and fallback', () => {
  const nonExistent = 'this.key.does.not.exist';
  assert.equal(t('si-LK', nonExistent), nonExistent);
  assert.equal(t('ta-LK', nonExistent), nonExistent);
  assert.equal(t('en-LK', nonExistent), nonExistent);

  // Parameter replacement test
  DICTIONARY['en-LK']['test.hello'] = 'Hello {name}!';
  assert.equal(t('en-LK', 'test.hello', { name: 'Saman' }), 'Hello Saman!');

  // Parameter replacement with $ special characters test
  DICTIONARY['en-LK']['test.cost'] = 'Cost is {cost}';
  assert.equal(t('en-LK', 'test.cost', { cost: '$500' }), 'Cost is $500');

  delete DICTIONARY['en-LK']['test.hello'];
  delete DICTIONARY['en-LK']['test.cost'];
});

test('getHubDisplayName localizes hubs across EN, SI, TA with clean fallbacks', () => {
  const colomboHub = HUBS.find((h) => h.id === 'colombo')!;
  assert.ok(colomboHub);
  assert.equal(getHubDisplayName(colomboHub, 'en-LK'), 'Colombo');
  assert.equal(getHubDisplayName(colomboHub, 'si-LK'), 'කොළඹ');
  assert.equal(getHubDisplayName(colomboHub, 'ta-LK'), 'கொழும்பு');

  const galleHub = HUBS.find((h) => h.id === 'galle')!;
  assert.ok(galleHub);

  // Fallbacks
  assert.equal(getHubDisplayName(null), '');
  assert.equal(getHubDisplayName(undefined), '');
  assert.equal(getHubDisplayName(colomboHub, 'fr-FR'), 'Colombo');
});
