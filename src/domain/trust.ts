export type DrivingSkillLabel = 'poor' | 'average' | 'excellent';

export interface DriverTrustStats {
  verifiedPhone: boolean;
  verifiedNic: boolean;
  verifiedLicence: boolean;
  hasProfilePhoto: boolean;
  completedRidesLast12Months: number;
  overallRating: number;
  drivingSkillScore: number; // 1.0 to 3.0
  cancellationRatePercent: number;
  avgResponseHours: number;
}

export interface DoubleBlindRating {
  id: string;
  bookingId: string;
  fromUserId: string;
  toUserId: string;
  stars: number; // 1 to 5
  drivingSkill?: DrivingSkillLabel;
  comment: string;
  createdAt: string;
  tripArrivalAt: string;
}

export interface NicValidationResult {
  valid: boolean;
  format?: 'old_9_vx' | 'new_12';
  birthYear?: number;
}

const SL_PHONE_REGEX = /^\+947[0-9]{8}$/;
const OLD_NIC_REGEX = /^([0-9]{2})([0-9]{3})([0-9]{4})([vVxX])$/;
const NEW_NIC_REGEX = /^((?:19|20)[0-9]{2})([0-9]{3})([0-9]{5})$/;

export function validateSriLankaPhone(phone: string): boolean {
  return SL_PHONE_REGEX.test(phone.trim());
}

export function validateSriLankaNic(nic: string): NicValidationResult {
  const cleaned = nic.trim();
  const oldMatch = cleaned.match(OLD_NIC_REGEX);
  if (oldMatch) {
    const yy = Number(oldMatch[1]);
    const dayOfYear = Number(oldMatch[2]);
    const validDay = (dayOfYear >= 1 && dayOfYear <= 366) || (dayOfYear >= 501 && dayOfYear <= 866);
    if (!validDay) return { valid: false };
    return {
      valid: true,
      format: 'old_9_vx',
      birthYear: 1900 + yy,
    };
  }

  const newMatch = cleaned.match(NEW_NIC_REGEX);
  if (newMatch) {
    const yyyy = Number(newMatch[1]);
    const dayOfYear = Number(newMatch[2]);
    const validDay = (dayOfYear >= 1 && dayOfYear <= 366) || (dayOfYear >= 501 && dayOfYear <= 866);
    if (!validDay) return { valid: false };
    return {
      valid: true,
      format: 'new_12',
      birthYear: yyyy,
    };
  }

  return { valid: false };
}

export function evaluateSuperDriver(stats: DriverTrustStats): {
  isSuperDriver: boolean;
  unmetCriteria: string[];
} {
  const unmet: string[] = [];

  if (!(stats.verifiedPhone && stats.verifiedNic && stats.verifiedLicence && stats.hasProfilePhoto)) {
    unmet.push('Complete Verified Profile (+94 Phone, Sri Lankan NIC, Driving Licence & Photo)');
  }
  if (stats.completedRidesLast12Months < 3) {
    unmet.push('At least 3 completed rides in the past 12 months');
  }
  if (stats.overallRating < 4.7) {
    unmet.push('4.7+ average overall rating');
  }
  if (stats.drivingSkillScore < 2.8) {
    unmet.push('2.8+ driving skills score');
  }
  if (stats.cancellationRatePercent >= 5.0) {
    unmet.push('Cancellation rate below 5%');
  }
  if (stats.avgResponseHours > 3.0) {
    unmet.push('Respond to booking requests in under 3 hours');
  }

  return {
    isSuperDriver: unmet.length === 0,
    unmetCriteria: unmet,
  };
}

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

export function resolveRatingVisibility(
  rating: DoubleBlindRating,
  hasCounterpartyRated: boolean,
  nowIso: string
): boolean {
  if (hasCounterpartyRated) {
    return true;
  }
  const arrivalMs = +new Date(rating.tripArrivalAt);
  const nowMs = +new Date(nowIso);
  return nowMs - arrivalMs >= FOURTEEN_DAYS_MS;
}
