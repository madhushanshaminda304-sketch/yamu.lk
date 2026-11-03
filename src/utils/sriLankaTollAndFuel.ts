/**
 * Sri Lanka Fuel Prices & RDA Expressway Toll Cost-Split Engine
 * Verified November 2026 Ceypetco & Lanka IOC fuel retail rates
 * and gazetted Category 1 (4-wheel passenger car/SUV) RDA point-to-point toll tables.
 */

export const SRI_LANKA_FUEL_PRICES = {
  petrol92: 424,
  petrol95: 490,
  autoDiesel: 397,
  superDiesel: 543,
} as const;

export type FuelTypeId = keyof typeof SRI_LANKA_FUEL_PRICES | 'hybrid';

export const FUEL_TYPE_META: Record<
  FuelTypeId,
  { label: string; pricePerLitre: number; kmPerLitre: number }
> = {
  petrol92: {
    label: 'Petrol 92 Octane',
    pricePerLitre: 424,
    kmPerLitre: 14.0,
  },
  petrol95: {
    label: 'Petrol 95 Octane',
    pricePerLitre: 490,
    kmPerLitre: 14.5,
  },
  autoDiesel: {
    label: 'Auto Diesel',
    pricePerLitre: 397,
    kmPerLitre: 15.0,
  },
  superDiesel: {
    label: 'Super Diesel',
    pricePerLitre: 543,
    kmPerLitre: 15.5,
  },
  hybrid: {
    label: 'Hybrid / EV Equivalent',
    pricePerLitre: 424,
    kmPerLitre: 22.0,
  },
};

/**
 * Gazetted Road Development Authority (RDA) Category 1 toll rates (LKR).
 * Normalized point-to-point highway segments for passenger cars and SUVs.
 */
export const RDA_EXPRESSWAY_TOLLS: Record<string, number> = {
  // Southern Expressway (E01)
  'makumbura-dodangoda': 300,
  'makumbura-kurundugahahetekma': 400,
  'makumbura-galle': 500,
  'makumbura-matara': 650,
  'colombo-galle': 500,
  'colombo-matara': 650,

  // Through-ticket Katunayake (E03) to Galle (E01) via E02 Outer Circular
  'katunayake-galle': 800,
  'katunayake-matara': 950,

  // Katunayake Airport Expressway (E03)
  'colombo-katunayake': 350,
  'peliyagoda-katunayake': 350,

  // Outer Circular Expressway (E02)
  'kadawatha-kerawalapitiya': 200,

  // Central Expressway (E04)
  'mirigama-kurunegala': 300,
  'kadawatha-kurunegala': 300,
  'colombo-kandy': 300,
};

export type TripFrequency = 'one_way' | 'weekend_return' | 'daily_commute';

export interface CalculatorCorridorProfile {
  id: string;
  name: string;
  routeCode: string;
  originHubId: string;
  destinationHubId: string;
  distanceKm: number;
  tollLkr: number;
  expresswayName: string;
  description: string;
}

export const CALCULATOR_CORRIDORS: readonly CalculatorCorridorProfile[] = [
  {
    id: 'makumbura-galle',
    name: 'Makumbura MMC → Galle',
    routeCode: 'E01',
    originHubId: 'makumbura',
    destinationHubId: 'galle',
    distanceKm: 95,
    tollLkr: 500,
    expresswayName: 'Southern Expressway (E01)',
    description: 'Fastest link between Western Province commuter hub and Galle Fort.',
  },
  {
    id: 'colombo-kandy',
    name: 'Colombo → Kandy',
    routeCode: 'E04 / A1',
    originHubId: 'colombo',
    destinationHubId: 'kandy',
    distanceKm: 116,
    tollLkr: 300,
    expresswayName: 'Central Expressway (E04) & A1',
    description: 'Bypasses Kadawatha & Kegalle bottle-necks via Mirigama/Kurunegala.',
  },
  {
    id: 'colombo-matara',
    name: 'Colombo → Matara',
    routeCode: 'E01',
    originHubId: 'colombo',
    destinationHubId: 'matara',
    distanceKm: 126,
    tollLkr: 650,
    expresswayName: 'Southern Expressway (E01)',
    description: 'Full southern throughway terminating at Godagama/Palatuwa exit.',
  },
  {
    id: 'katunayake-galle',
    name: 'Katunayake BIA → Galle',
    routeCode: 'E03 + E02 + E01',
    originHubId: 'katunayake',
    destinationHubId: 'galle',
    distanceKm: 145,
    tollLkr: 800,
    expresswayName: 'Through-ticket E03 + E02 + E01',
    description: 'Direct airport terminal to southern coast without touching city roads.',
  },
  {
    id: 'malabe-colombo',
    name: 'Malabe / Kaduwela → Colombo',
    routeCode: 'A0 / Daily',
    originHubId: 'makumbura',
    destinationHubId: 'colombo',
    distanceKm: 16,
    tollLkr: 0,
    expresswayName: 'Parliament / Baseline Corridor (Toll-Free)',
    description: 'Heavy IT park & ministry daily work commute corridor.',
  },
] as const;

/**
 * Looks up point-to-point RDA expressway toll rate with bidirectional normalization.
 */
export function lookupRdaExpresswayToll(
  originHubId: string | null | undefined,
  destinationHubId: string | null | undefined
): number {
  if (!originHubId || !destinationHubId) return 0;
  const o = originHubId.toLowerCase().trim();
  const d = destinationHubId.toLowerCase().trim();

  const key1 = `${o}-${d}`;
  if (key1 in RDA_EXPRESSWAY_TOLLS) {
    return RDA_EXPRESSWAY_TOLLS[key1];
  }

  const key2 = `${d}-${o}`;
  if (key2 in RDA_EXPRESSWAY_TOLLS) {
    return RDA_EXPRESSWAY_TOLLS[key2];
  }

  return 0;
}

export function calculateSoloDriveCost(input: {
  distanceKm: number;
  fuelType: FuelTypeId;
  tollLkr?: number;
  customKmPerLitre?: number;
}): {
  fuelLitres: number;
  fuelCostLkr: number;
  tollLkr: number;
  totalCostLkr: number;
} {
  const meta = FUEL_TYPE_META[input.fuelType] || FUEL_TYPE_META.petrol92;
  const kmPerLitre = input.customKmPerLitre && input.customKmPerLitre > 0
    ? input.customKmPerLitre
    : meta.kmPerLitre;
  const tollLkr = Math.max(0, input.tollLkr ?? 0);

  const fuelLitres = Math.round((Math.max(1, input.distanceKm) / kmPerLitre) * 10) / 10;
  const fuelCostLkr = Math.round(fuelLitres * meta.pricePerLitre);
  const totalCostLkr = fuelCostLkr + tollLkr;

  return {
    fuelLitres,
    fuelCostLkr,
    tollLkr,
    totalCostLkr,
  };
}

export function calculateFairPerSeatShare(input: {
  totalSoloCostLkr: number;
  emptySeatsShared: number;
}): {
  perSeatLkr: number;
  totalPassengerPoolLkr: number;
  driverEffectiveExpenseLkr: number;
  savingsPercentVsSolo: number;
} {
  const seats = Math.max(1, Math.min(4, input.emptySeatsShared));
  // Total travelers onboard = 1 driver + N passengers
  const totalTravelers = seats + 1;
  const exactPerSeat = input.totalSoloCostLkr / totalTravelers;

  // Round to friendly LKR 50 step
  const perSeatLkr = Math.max(150, Math.round(exactPerSeat / 50) * 50);
  const totalPassengerPoolLkr = perSeatLkr * seats;
  const driverEffectiveExpenseLkr = Math.max(0, input.totalSoloCostLkr - totalPassengerPoolLkr);

  const savingsPercentVsSolo = Math.min(
    90,
    Math.max(25, Math.round((1 - perSeatLkr / Math.max(1, input.totalSoloCostLkr)) * 100))
  );

  return {
    perSeatLkr,
    totalPassengerPoolLkr,
    driverEffectiveExpenseLkr,
    savingsPercentVsSolo,
  };
}

export interface CarpoolImpactSummary {
  corridor: CalculatorCorridorProfile;
  fuelMeta: { label: string; pricePerLitre: number; kmPerLitre: number };
  distanceKm: number;
  tollLkr: number;
  fuelCostLkr: number;
  soloCostLkr: number;
  perSeatShareLkr: number;
  savingsPercent: number;
  seatsShared: number;
  frequency: TripFrequency;
  frequencyTripsPerMonth: number;
  monthlyDriverSavingsLkr: number;
  annualDriverSavingsLkr: number;
  carsRemoved: number;
  monthlyFuelLitresSaved: number;
  monthlyCo2KgSaved: number;
}

export function calculateCarpoolImpact(input: {
  corridorId: string;
  fuelType: FuelTypeId;
  emptySeatsShared: number;
  frequency: TripFrequency;
}): CarpoolImpactSummary {
  const corridor =
    CALCULATOR_CORRIDORS.find((c) => c.id === input.corridorId) || CALCULATOR_CORRIDORS[0];
  const fuelMeta = FUEL_TYPE_META[input.fuelType] || FUEL_TYPE_META.petrol92;

  const solo = calculateSoloDriveCost({
    distanceKm: corridor.distanceKm,
    fuelType: input.fuelType,
    tollLkr: corridor.tollLkr,
  });

  const seatsShared = Math.max(1, Math.min(4, input.emptySeatsShared));
  const share = calculateFairPerSeatShare({
    totalSoloCostLkr: solo.totalCostLkr,
    emptySeatsShared: seatsShared,
  });

  // Frequency trips per month
  let frequencyTripsPerMonth = 1;
  if (input.frequency === 'daily_commute') {
    // 20 working days x 2 trips/day (morning + evening) = 40 trips
    frequencyTripsPerMonth = 40;
  } else if (input.frequency === 'weekend_return') {
    // 4 return trips per month = 8 one-way legs
    frequencyTripsPerMonth = 8;
  } else {
    // One-off single leg
    frequencyTripsPerMonth = 1;
  }

  // Cost recovered by the driver from passengers
  const tripDriverSavingsLkr = share.perSeatLkr * seatsShared;
  const monthlyDriverSavingsLkr = Math.round(tripDriverSavingsLkr * frequencyTripsPerMonth);
  const annualDriverSavingsLkr = monthlyDriverSavingsLkr * 12;

  // Litres of imported fuel saved by taking cars off the road
  const fuelLitresPerTrip = (corridor.distanceKm / fuelMeta.kmPerLitre) * seatsShared;
  const monthlyFuelLitresSaved = Math.round(fuelLitresPerTrip * frequencyTripsPerMonth);
  // Standard emission factor: 2.31 kg CO2 per litre of fuel
  const monthlyCo2KgSaved = Math.round(monthlyFuelLitresSaved * 2.31);

  return {
    corridor,
    fuelMeta,
    distanceKm: corridor.distanceKm,
    tollLkr: corridor.tollLkr,
    fuelCostLkr: solo.fuelCostLkr,
    soloCostLkr: solo.totalCostLkr,
    perSeatShareLkr: share.perSeatLkr,
    savingsPercent: share.savingsPercentVsSolo,
    seatsShared,
    frequency: input.frequency,
    frequencyTripsPerMonth,
    monthlyDriverSavingsLkr,
    annualDriverSavingsLkr,
    carsRemoved: seatsShared,
    monthlyFuelLitresSaved,
    monthlyCo2KgSaved,
  };
}

/**
 * Generates transparent Sri Lankan cost-split badge text for corridor cards and search results.
 */
export function generateCostSplitBadge(
  distanceKm: number,
  tollLkr: number,
  routeCode = 'E01'
): {
  badgeText: string;
  tollPart: string;
  savingsPart: string;
} {
  const solo = calculateSoloDriveCost({
    distanceKm,
    fuelType: 'petrol92',
    tollLkr,
  });
  const share = calculateFairPerSeatShare({
    totalSoloCostLkr: solo.totalCostLkr,
    emptySeatsShared: 2,
  });

  const tollPart = tollLkr > 0 ? `Includes ${routeCode} Toll (LKR ${tollLkr}) + Fuel Split` : 'Fuel Cost-Split';
  const savingsPart = `Save ${share.savingsPercentVsSolo}% vs Solo Drive`;

  return {
    badgeText: `${tollPart} • ${savingsPart}`,
    tollPart,
    savingsPart,
  };
}
