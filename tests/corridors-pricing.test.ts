import test from 'node:test';
import assert from 'node:assert/strict';
import { findRouteOptions, getHubById, HUBS } from '../src/domain/corridors.ts';
import {
  calculateRecommendedLkr,
  getContributionBounds,
  getPriceBand,
  stepContributionLkr,
  calculateLegContribution,
} from '../src/domain/pricing.ts';

test('Sri Lankan Hub catalog contains major cities and expressway interchanges with trilingual names', () => {
  assert.ok(HUBS.length >= 25);
  const makumbura = getHubById('makumbura');
  assert.ok(makumbura);
  assert.equal(makumbura.isExpresswayInterchange, true);
  assert.ok(makumbura.name.si.length > 0);
  assert.ok(makumbura.name.ta.length > 0);
});

test('findRouteOptions returns Expressway (E01 Tolls) and Coastal (A2 No Tolls) between Colombo and Galle', () => {
  const routes = findRouteOptions('colombo', 'galle');
  assert.ok(routes.length >= 2);
  const e01 = routes.find((r) => r.hasTolls);
  const a2 = routes.find((r) => !r.hasTolls);
  assert.ok(e01, 'Expected E01 Southern Expressway route option');
  assert.ok(a2, 'Expected A2 Galle Road non-toll route option');
  assert.ok(e01.durationMinutes < a2.durationMinutes);
  assert.ok(e01.intermediateHubs.includes('dodangoda'));
});

test('LKR cost-sharing pricing enforces +/-25% bounds, LKR 50 steps, and price bands', () => {
  const rec = calculateRecommendedLkr(120, 'included', 400);
  assert.equal(rec % 50, 0);
  const bounds = getContributionBounds(rec);
  assert.equal(bounds.stepLkr, 50);
  assert.ok(bounds.minLkr <= rec && bounds.maxLkr >= rec);
  assert.equal(stepContributionLkr(bounds.maxLkr, 1, bounds), bounds.maxLkr);
  assert.equal(stepContributionLkr(bounds.minLkr, -1, bounds), bounds.minLkr);
  assert.equal(getPriceBand(rec, rec), 'green');
  assert.equal(getPriceBand(bounds.maxLkr, rec), 'red');
  const legPrice = calculateLegContribution(2500, 125, 60);
  assert.equal(legPrice % 50, 0);
  assert.ok(legPrice > 0 && legPrice < 2500);
});
