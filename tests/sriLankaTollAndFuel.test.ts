import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  SRI_LANKA_FUEL_PRICES,
  RDA_EXPRESSWAY_TOLLS,
  lookupRdaExpresswayToll,
  calculateSoloDriveCost,
  calculateFairPerSeatShare,
  calculateCarpoolImpact,
  CALCULATOR_CORRIDORS,
  type FuelTypeId,
  type TripFrequency,
} from '../src/utils/sriLankaTollAndFuel.ts';

describe('Sri Lanka Fuel Prices & RDA Expressway Toll Utility', () => {
  it('contains official November 2026 Sri Lankan fuel prices', () => {
    assert.strictEqual(SRI_LANKA_FUEL_PRICES.petrol92, 424);
    assert.strictEqual(SRI_LANKA_FUEL_PRICES.petrol95, 490);
    assert.strictEqual(SRI_LANKA_FUEL_PRICES.autoDiesel, 397);
    assert.strictEqual(SRI_LANKA_FUEL_PRICES.superDiesel, 543);
  });

  it('looks up exact gazetted RDA Category 1 expressway tolls', () => {
    // Makumbura / Kottawa ↔ Dodangoda: LKR 300
    assert.strictEqual(lookupRdaExpresswayToll('makumbura', 'dodangoda'), 300);
    assert.strictEqual(lookupRdaExpresswayToll('dodangoda', 'makumbura'), 300);

    // Makumbura / Kottawa ↔ Pinnaduwa (Galle): LKR 500
    assert.strictEqual(lookupRdaExpresswayToll('makumbura', 'galle'), 500);

    // Makumbura / Kottawa ↔ Godagama / Palatuwa (Matara): LKR 650
    assert.strictEqual(lookupRdaExpresswayToll('makumbura', 'matara'), 650);

    // Katunayake ↔ Galle (E03+E02+E01 through-ticket): LKR 800
    assert.strictEqual(lookupRdaExpresswayToll('katunayake', 'galle'), 800);

    // Peliyagoda / Colombo ↔ Katunayake BIA (E03): LKR 350
    assert.strictEqual(lookupRdaExpresswayToll('colombo', 'katunayake'), 350);

    // Kadawatha ↔ Kerawalapitiya (E02): LKR 200
    assert.strictEqual(lookupRdaExpresswayToll('kadawatha', 'kerawalapitiya'), 200);

    // Mirigama ↔ Kurunegala (E04 Central Expressway): LKR 300
    assert.strictEqual(lookupRdaExpresswayToll('mirigama', 'kurunegala'), 300);
  });

  it('calculates solo drive cost accurately with distance, fuel type, and tolls', () => {
    // Makumbura to Galle: 95 km, Petrol 92 (LKR 424/L), toll LKR 500
    // At ~14 km/L: fuel = (95 / 14) * 424 = ~2,877 LKR. Total with toll = ~3,377 LKR
    const cost = calculateSoloDriveCost({
      distanceKm: 95,
      fuelType: 'petrol92',
      tollLkr: 500,
    });

    assert.ok(cost.totalCostLkr > 3000);
    assert.strictEqual(cost.tollLkr, 500);
    assert.strictEqual(cost.fuelCostLkr, cost.totalCostLkr - cost.tollLkr);
  });

  it('calculates fair per-seat cost-share when split across passengers', () => {
    // Total solo drive: LKR 5,100 (e.g. Matara trip)
    // When 2 passengers join (total 3 people in vehicle):
    // Per-seat share = 5,100 / 3 = 1,700 LKR
    const share = calculateFairPerSeatShare({
      totalSoloCostLkr: 5100,
      emptySeatsShared: 2,
    });

    assert.strictEqual(share.perSeatLkr, 1700);
    assert.strictEqual(share.savingsPercentVsSolo, 67); // saves 67%
  });

  it('computes realistic commuter impact for one-way, weekend, and daily commute', () => {
    const oneWay = calculateCarpoolImpact({
      corridorId: 'makumbura-galle',
      fuelType: 'petrol92',
      emptySeatsShared: 2,
      frequency: 'one_way',
    });

    assert.strictEqual(oneWay.carsRemoved, 2);
    assert.ok(oneWay.perSeatShareLkr > 0);
    assert.ok(oneWay.soloCostLkr > oneWay.perSeatShareLkr);

    const dailyCommute = calculateCarpoolImpact({
      corridorId: 'makumbura-galle',
      fuelType: 'petrol92',
      emptySeatsShared: 2,
      frequency: 'daily_commute',
    });

    // 20 working days x 2 trips/day = 40 trips/month
    assert.ok(dailyCommute.monthlyDriverSavingsLkr >= 35000);
    assert.strictEqual(dailyCommute.frequencyTripsPerMonth, 40);
  });

  it('provides all 5 target corridor profiles for the calculator', () => {
    assert.strictEqual(CALCULATOR_CORRIDORS.length, 5);
    const corridorIds = CALCULATOR_CORRIDORS.map((c) => c.id);
    assert.ok(corridorIds.includes('makumbura-galle'));
    assert.ok(corridorIds.includes('colombo-kandy'));
    assert.ok(corridorIds.includes('colombo-matara'));
    assert.ok(corridorIds.includes('katunayake-galle'));
    assert.ok(corridorIds.includes('malabe-colombo'));
  });
});
