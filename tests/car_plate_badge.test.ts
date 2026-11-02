import test from 'node:test';
import assert from 'node:assert/strict';
import { formatSriLankanPlate } from '../src/domain/carPlate.ts';

test('CarPlate handles unknown formats gracefully with national fallback', () => {
  const fallback = formatSriLankanPlate('Unknown');
  assert.equal(fallback.province, 'WP');
  assert.equal(fallback.registration, 'Unknown');
  assert.equal(fallback.masked, 'WP ••••');
  assert.equal(fallback.isValidFormat, false);
});

test('CarPlate accurately distinguishes EV electric vehicles by letter series', () => {
  const ev1 = formatSriLankanPlate('WP EK-1234');
  assert.equal(ev1.isEv, true);
  assert.equal(ev1.registration, 'EK-1234');

  const regular = formatSriLankanPlate('WP CAH-9876');
  assert.equal(regular.isEv, false);
  assert.equal(regular.registration, 'CAH-9876');
});
