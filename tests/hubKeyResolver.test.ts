import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveHubKey, ALL_HUBS } from '../src/domain/corridors.ts';

test('resolveHubKey resolves raw hub IDs', () => {
  assert.equal(resolveHubKey('colombo', 'colombo'), 'colombo');
  assert.equal(resolveHubKey('galle', 'colombo'), 'galle');
  assert.equal(resolveHubKey('makumbura', 'colombo'), 'makumbura');
  assert.equal(resolveHubKey('kandy', 'colombo'), 'kandy');
});

test('resolveHubKey handles formatted strings with emojis and parentheses', () => {
  assert.equal(resolveHubKey('Galle ⚡ (MMC/Exit)', 'colombo'), 'galle');
  assert.equal(resolveHubKey('Makumbura ⚡ (MMC/Exit)', 'colombo'), 'makumbura');
  assert.equal(resolveHubKey('Colombo Fort Station', 'colombo'), 'colombo');
  assert.equal(resolveHubKey('Kandy (Clock Tower)', 'colombo'), 'kandy');
});

test('resolveHubKey handles null, undefined, and garbage gracefully', () => {
  assert.equal(resolveHubKey(null, 'colombo'), 'colombo');
  assert.equal(resolveHubKey(undefined, 'galle'), 'galle');
  assert.equal(resolveHubKey('', 'kandy'), 'kandy');
  assert.equal(resolveHubKey('unknown-place-xyz', 'colombo'), 'colombo');
});

test('resolveHubKey handles Sinhala and Tamil hub names', () => {
  assert.equal(resolveHubKey('කොළඹ', 'colombo'), 'colombo');
  assert.equal(resolveHubKey('මහනුවර', 'colombo'), 'kandy');
  assert.equal(resolveHubKey('காலி', 'colombo'), 'galle');
});
