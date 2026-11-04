import test from 'node:test';
import assert from 'node:assert/strict';
import { localeFromPath, localizedPath, preferredLocale, stripLanguagePrefix } from '../src/domain/languageRoutes.ts';
import { SUPPORTED_LOCALES, formatColomboDate } from '../src/domain/i18n.ts';
import { UI_MESSAGES, uiText } from '../src/domain/uiText.ts';
import { localizeNotification } from '../src/domain/notifications.ts';
import { registerBackButtonHandler, triggerBackActionForTesting } from '../src/native/backButton.ts';

test('language routes preserve deep links, filters, fragments and ride identifiers', () => {
  assert.equal(localeFromPath('/si/rides/ride-123'), 'si-LK');
  assert.equal(localeFromPath('/ta/'), 'ta-LK');
  assert.equal(localeFromPath('/search'), null);
  assert.equal(localeFromPath('/english/search'), null);
  assert.equal(stripLanguagePrefix('/si/'), '/');
  assert.equal(stripLanguagePrefix('/si/search'), '/search');
  assert.equal(localizedPath('/en/rides/ride-123?from=colombo&seats=2#booking', 'ta-LK'), '/ta/rides/ride-123?from=colombo&seats=2#booking');
  assert.equal(localizedPath('/search?from=si', 'si-LK'), '/si/search?from=si');
  assert.equal(localizedPath('https://example.com/en/', 'si-LK'), 'https://example.com/en/');
  assert.equal(localizedPath('//example.com/', 'si-LK'), '//example.com/');
  assert.equal(localizedPath('../search', 'si-LK'), '../search');
  assert.equal(localizedPath('?tab=requests', 'si-LK'), '?tab=requests');
});

test('saved choices take precedence over device suggestions, with an English fallback', () => {
  assert.equal(preferredLocale('ta-LK', ['si-LK']), 'ta-LK');
  assert.equal(preferredLocale(null, ['fr-FR', 'si']), 'si-LK');
  assert.equal(preferredLocale(null, ['ta-IN']), 'ta-LK');
  assert.equal(preferredLocale(null, []), 'en-LK');
});

test('every supplemental interface message has Sinhala, Tamil and Russian translations with matching placeholders', () => {
  const placeholders = (text: string) => [...text.matchAll(/\{([^}]+)\}/g)].map(match => match[1]).sort();
  for (const [source, translations] of Object.entries(UI_MESSAGES)) {
    assert.equal(translations.length, 3, source);
    for (const translation of translations) {
      assert.ok(translation.trim(), source);
      assert.deepEqual(placeholders(translation), placeholders(source), source);
    }
  }
  for (const locale of SUPPORTED_LOCALES.filter(locale => locale !== 'en-LK')) {
    for (const source of ['Sign In', 'Your Rides & Bookings', 'Send Verification Code', 'Your Email', 'Page not found']) {
      assert.notEqual(uiText(locale, source), source, `${locale}: ${source}`);
    }
  }
});

test('dynamic copy supports reordered placeholders and literal user values', () => {
  const text = uiText('si-LK', 'Ride from {0} to {1} with {2}', { 0: 'A', 1: 'B', 2: '$& <name>' });
  assert.match(text, /\$& <name>/);
  assert.equal(uiText('en-LK', 'Ride from {0} to {1} with {2}', { 0: 'A', 1: 'B', 2: 'Nimal' }), 'Ride from A to B with Nimal');
  assert.notEqual(uiText('ta-LK', 'Incorrect code. 2 attempts remaining.'), 'Incorrect code. 2 attempts remaining.');
  assert.equal(uiText('si-LK', 'My own driver note'), 'My own driver note');
});

test('dates use the selected language while retaining the Colombo timezone', () => {
  const iso = '2026-11-04T23:30:00Z';
  for (const locale of SUPPORTED_LOCALES) {
    const expected = new Intl.DateTimeFormat(locale, { timeZone: 'Asia/Colombo', weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(iso));
    assert.equal(formatColomboDate(iso, locale), expected);
  }
});

test('saved notification templates can be rendered in another language without changing identifiers or user values', () => {
  const notification = {
    id: 'notification-1', title: '', body: '', createdAt: '2026-11-04T00:00:00Z',
    copy: { title: 'Instant Booking Confirmed: {0} → {1}', body: '{0} seat(s) reserved with {1}. Settle {2} onboard via {3}.',
      fromHubId: 'colombo', toHubId: 'galle', amount: 2500, settlement: 'Cash (LKR)', bodyValues: { 0: 2, 1: 'Nimal {0}' } },
  };
  const english = localizeNotification(notification, 'en-LK');
  const tamil = localizeNotification(english, 'ta-LK');
  assert.equal(tamil.id, english.id);
  assert.match(tamil.title, /கொழும்பு/);
  assert.match(tamil.body, /Nimal \{0\}/);
  assert.deepEqual(tamil.copy, english.copy);
  assert.equal(localizeNotification(tamil, 'en-LK').body, english.body);
});

test('Android back handling recognizes a language homepage and navigates back on a nested route', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const fakeWindow = { location: { pathname: '/ta/' }, addEventListener() {}, removeEventListener() {} };
  Object.defineProperty(globalThis, 'window', { configurable: true, value: fakeWindow });
  const navigations: (string | number)[] = [];
  let prompts = 0;
  const cleanup = registerBackButtonHandler(path => navigations.push(path), () => false, () => {}, () => prompts++);
  try {
    triggerBackActionForTesting();
    assert.equal(prompts, 1);
    assert.deepEqual(navigations, []);
    fakeWindow.location.pathname = '/ta/publish';
    triggerBackActionForTesting();
    assert.deepEqual(navigations, [-1]);
  } finally {
    cleanup();
    if (original) Object.defineProperty(globalThis, 'window', original);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});
