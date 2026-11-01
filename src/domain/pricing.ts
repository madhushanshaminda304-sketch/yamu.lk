export type TollPolicy = 'included' | 'split_at_gate' | 'no_tolls';
export type PriceBand = 'green' | 'amber' | 'red';

export interface ContributionBounds {
  minLkr: number;
  recommendedLkr: number;
  maxLkr: number;
  stepLkr: 50;
}

const BASE_LKR_PER_KM = 20;
const MIN_CONTRIBUTION_LKR = 150;
const STEP_LKR = 50;

export function roundToStep50(value: number): number {
  return Math.max(MIN_CONTRIBUTION_LKR, Math.round(value / STEP_LKR) * STEP_LKR);
}

export function calculateRecommendedLkr(
  distanceKm: number,
  tollPolicy: TollPolicy = 'no_tolls',
  estimatedTollLkr = 0
): number {
  const safeDistance = Math.max(10, distanceKm);
  const fuelShare = safeDistance * BASE_LKR_PER_KM;
  const tollSharePerSeat =
    tollPolicy === 'included' ? Math.round(Math.max(0, estimatedTollLkr) / 2) : 0;
  return roundToStep50(fuelShare + tollSharePerSeat);
}

export function getContributionBounds(recommendedLkr: number): ContributionBounds {
  const rec = roundToStep50(recommendedLkr);
  const minLkr = roundToStep50(rec * 0.75);
  const maxLkr = Math.max(rec + STEP_LKR, roundToStep50(rec * 1.25));
  return {
    minLkr,
    recommendedLkr: rec,
    maxLkr,
    stepLkr: STEP_LKR,
  };
}

export function getPriceBand(priceLkr: number, recommendedLkr: number): PriceBand {
  if (priceLkr <= recommendedLkr) {
    return 'green';
  }
  if (priceLkr <= Math.round(recommendedLkr * 1.12)) {
    return 'amber';
  }
  return 'red';
}

export function stepContributionLkr(
  currentLkr: number,
  deltaSteps: number,
  bounds: Pick<ContributionBounds, 'minLkr' | 'maxLkr'>
): number {
  const next = roundToStep50(currentLkr + deltaSteps * STEP_LKR);
  return Math.min(bounds.maxLkr, Math.max(bounds.minLkr, next));
}

export function calculateLegContribution(
  fullRidePriceLkr: number,
  fullDistanceKm: number,
  legDistanceKm: number
): number {
  if (fullDistanceKm <= 0 || legDistanceKm >= fullDistanceKm) {
    return roundToStep50(fullRidePriceLkr);
  }
  const ratio = Math.max(0.15, Math.min(1, legDistanceKm / fullDistanceKm));
  const proportional = roundToStep50(fullRidePriceLkr * ratio);
  return Math.min(roundToStep50(fullRidePriceLkr), proportional);
}
