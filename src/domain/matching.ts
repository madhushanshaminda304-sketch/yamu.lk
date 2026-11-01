import type { TollPolicy } from './pricing.ts';
import { roundToStep50 } from './pricing.ts';

export type ChattinessLevel = 'bla' | 'blabla' | 'blablabla';
export type TernaryPreference = 'yes' | 'maybe' | 'no';
export type LuggageSize = 'small' | 'medium' | 'large';
export type VehicleCategory = 'car' | 'suv' | 'van';
export type ApprovalMode = 'instant' | 'manual';
export type SmartTag = 'cheapest' | 'earliest' | 'fastest' | 'boost' | 'cheapest_and_earliest';

export interface ComfortProfile {
  chattiness: ChattinessLevel;
  maxTwoInBack: boolean;
  luggage: LuggageSize;
  music: TernaryPreference;
  pets: TernaryPreference;
  smoking: TernaryPreference;
  womenOnly: boolean;
}

export interface VehicleInfo {
  makeModel: string;
  category: VehicleCategory;
  plateHint: string;
  acGuaranteed: boolean;
}

export interface DriverSummary {
  id: string;
  name: string;
  phone?: string;
  rating: number;
  ratingsCount: number;
  drivingSkillScore: number; // 1.0 to 3.0
  completedRides: number;
  verifiedPhone: boolean;
  verifiedNic: boolean;
  verifiedLicence: boolean;
  isSuperDriver: boolean;
  responseHours: number;
  bio?: string;
}

export interface RideStop {
  hubId: string;
  stopIndex: number;
  arrivalAt: string;
  departureAt: string;
  kmFromOrigin: number;
  priceFromOriginLkr: number;
  pickupLandmark: string;
  isBoostStop?: boolean;
}

export interface Ride {
  id: string;
  driverId: string;
  corridorId: string;
  corridorCode: string;
  corridorName: string;
  hasTolls: boolean;
  tollPolicy: TollPolicy;
  estimatedTollLkr: number;
  originHubId: string;
  destinationHubId: string;
  departureDate: string;
  departureAt: string;
  arrivalAt: string;
  totalDistanceKm: number;
  fullPriceLkr: number;
  recommendedPriceLkr: number;
  totalSeats: number;
  segmentSeatsAvailable: number[];
  stops: RideStop[];
  approvalMode: ApprovalMode;
  boostEnabled: boolean;
  luggageCapacity?: LuggageSize;
  vehicle: VehicleInfo;
  comfort: ComfortProfile;
  driver: DriverSummary;
  notes: string;
  returnRideId?: string;
  status: 'published' | 'cancelled';
}

export interface LegBookingCheck {
  allowed: boolean;
  fromIndex: number;
  toIndex: number;
  availableSeatsOnLeg: number;
  legPriceLkr: number;
  legDistanceKm: number;
  isBoostLeg: boolean;
  fromStop?: RideStop;
  toStop?: RideStop;
  reason?: string;
}

export interface SearchQuery {
  fromHubId: string;
  toHubId: string;
  date: string;
  seats: number;
  sortBy?: 'departure' | 'price' | 'duration';
  timeWindow?: 'all' | 'before_6' | 'morning_6_12' | 'afternoon_12_18' | 'evening_after_18';
  maxPriceLkr?: number;
  instantOnly?: boolean;
  superDriverOnly?: boolean;
  verifiedOnly?: boolean;
  maxTwoInBackOnly?: boolean;
  womenOnly?: boolean;
  acOnly?: boolean;
  petsAllowedOnly?: boolean;
}

export interface MatchedRideResult {
  ride: Ride;
  fromStop: RideStop;
  toStop: RideStop;
  fromIndex: number;
  toIndex: number;
  availableSeatsOnLeg: number;
  legPriceLkr: number;
  legDistanceKm: number;
  legDurationMinutes: number;
  isBoostLeg: boolean;
  smartTags: SmartTag[];
}

export function canBookLeg(
  ride: Ride,
  fromHubId: string,
  toHubId: string,
  seatsRequested: number
): LegBookingCheck {
  if (ride.status !== 'published') {
    return {
      allowed: false,
      fromIndex: -1,
      toIndex: -1,
      availableSeatsOnLeg: 0,
      legPriceLkr: 0,
      legDistanceKm: 0,
      isBoostLeg: false,
      reason: 'Ride is no longer active.',
    };
  }

  const fromIndex = ride.stops.findIndex((s) => s.hubId === fromHubId);
  const toIndex = ride.stops.findIndex((s) => s.hubId === toHubId);

  if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) {
    return {
      allowed: false,
      fromIndex,
      toIndex,
      availableSeatsOnLeg: 0,
      legPriceLkr: 0,
      legDistanceKm: 0,
      isBoostLeg: false,
      reason: 'Stops do not follow this ride direction.',
    };
  }

  const fromStop = ride.stops[fromIndex];
  const toStop = ride.stops[toIndex];
  const isBoostLeg = fromIndex > 0 || toIndex < ride.stops.length - 1;

  if (isBoostLeg && !ride.boostEnabled && (fromStop.isBoostStop || toStop.isBoostStop)) {
    return {
      allowed: false,
      fromIndex,
      toIndex,
      availableSeatsOnLeg: 0,
      legPriceLkr: 0,
      legDistanceKm: 0,
      isBoostLeg: true,
      reason: 'Boost stopovers are disabled for this ride.',
    };
  }

  const touchedSegments = ride.segmentSeatsAvailable.slice(fromIndex, toIndex);
  const availableSeatsOnLeg = touchedSegments.length > 0 ? Math.min(...touchedSegments) : 0;
  const legDistanceKm = Math.max(10, toStop.kmFromOrigin - fromStop.kmFromOrigin);
  const rawPriceDiff = toStop.priceFromOriginLkr - fromStop.priceFromOriginLkr;
  const legPriceLkr = roundToStep50(rawPriceDiff);

  if (seatsRequested < 1 || seatsRequested > availableSeatsOnLeg) {
    return {
      allowed: false,
      fromIndex,
      toIndex,
      availableSeatsOnLeg,
      legPriceLkr,
      legDistanceKm,
      isBoostLeg,
      fromStop,
      toStop,
      reason: 'Not enough seats remain on one or more segments of this leg.',
    };
  }

  return {
    allowed: true,
    fromIndex,
    toIndex,
    availableSeatsOnLeg,
    legPriceLkr,
    legDistanceKm,
    isBoostLeg,
    fromStop,
    toStop,
  };
}

export function applyLegBooking(
  ride: Ride,
  fromIndex: number,
  toIndex: number,
  seats: number
): Ride {
  const nextSegments = ride.segmentSeatsAvailable.map((avail, segIdx) => {
    if (segIdx >= fromIndex && segIdx < toIndex) {
      if (avail < seats) {
        throw new Error(`Segment ${segIdx} has only ${avail} seats remaining.`);
      }
      return avail - seats;
    }
    return avail;
  });

  return {
    ...ride,
    segmentSeatsAvailable: nextSegments,
  };
}

export function releaseLegBooking(
  ride: Ride,
  fromIndex: number,
  toIndex: number,
  seats: number
): Ride {
  const nextSegments = ride.segmentSeatsAvailable.map((avail, segIdx) => {
    if (segIdx >= fromIndex && segIdx < toIndex) {
      return Math.min(ride.totalSeats, avail + seats);
    }
    return avail;
  });

  return {
    ...ride,
    segmentSeatsAvailable: nextSegments,
  };
}

function getColomboHour(isoString: string): number {
  const formatted = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Colombo',
    hour: '2-digit',
    hour12: false,
  }).format(new Date(isoString));
  return Number(formatted);
}

export function searchRides(rides: readonly Ride[], query: SearchQuery): MatchedRideResult[] {
  const matched: MatchedRideResult[] = [];

  for (const ride of rides) {
    if (ride.status !== 'published') continue;
    const leg = canBookLeg(ride, query.fromHubId, query.toHubId, query.seats || 1);
    if (!leg.allowed || !leg.fromStop || !leg.toStop) continue;

    const legDate = leg.fromStop.departureAt.slice(0, 10);
    if (query.date && ride.departureDate !== query.date && legDate !== query.date) continue;

    if (query.maxPriceLkr !== undefined && leg.legPriceLkr > query.maxPriceLkr) continue;
    if (query.instantOnly && ride.approvalMode !== 'instant') continue;
    if (query.superDriverOnly && !ride.driver.isSuperDriver) continue;
    if (query.verifiedOnly && !(ride.driver.verifiedNic && ride.driver.verifiedPhone)) continue;
    if (query.maxTwoInBackOnly && !ride.comfort.maxTwoInBack) continue;
    if (query.womenOnly && !ride.comfort.womenOnly) continue;
    if (query.acOnly && !ride.vehicle.acGuaranteed) continue;
    if (query.petsAllowedOnly && ride.comfort.pets === 'no') continue;

    if (query.timeWindow && query.timeWindow !== 'all') {
      const hour = getColomboHour(leg.fromStop.departureAt);
      if (query.timeWindow === 'before_6' && hour >= 6) continue;
      if (query.timeWindow === 'morning_6_12' && (hour < 6 || hour >= 12)) continue;
      if (query.timeWindow === 'afternoon_12_18' && (hour < 12 || hour >= 18)) continue;
      if (query.timeWindow === 'evening_after_18' && hour < 18) continue;
    }

    const depMs = +new Date(leg.fromStop.departureAt);
    const arrMs = +new Date(leg.toStop.arrivalAt);
    const legDurationMinutes = Math.max(15, Math.round((arrMs - depMs) / 60000));

    matched.push({
      ride,
      fromStop: leg.fromStop,
      toStop: leg.toStop,
      fromIndex: leg.fromIndex,
      toIndex: leg.toIndex,
      availableSeatsOnLeg: leg.availableSeatsOnLeg,
      legPriceLkr: leg.legPriceLkr,
      legDistanceKm: leg.legDistanceKm,
      legDurationMinutes,
      isBoostLeg: leg.isBoostLeg,
      smartTags: leg.isBoostLeg ? ['boost'] : [],
    });
  }

  const tagged = assignSmartTags(matched);

  const sortBy = query.sortBy ?? 'departure';
  return [...tagged].sort((a, b) => {
    if (sortBy === 'price') return a.legPriceLkr - b.legPriceLkr;
    if (sortBy === 'duration') return a.legDurationMinutes - b.legDurationMinutes;
    return +new Date(a.fromStop.departureAt) - +new Date(b.fromStop.departureAt);
  });
}

export function assignSmartTags(results: readonly MatchedRideResult[]): MatchedRideResult[] {
  if (results.length === 0) return [];

  const minPrice = Math.min(...results.map((r) => r.legPriceLkr));
  const minDepMs = Math.min(...results.map((r) => +new Date(r.fromStop.departureAt)));
  const minDuration = Math.min(...results.map((r) => r.legDurationMinutes));

  return results.map((item) => {
    const tags: SmartTag[] = [];
    const isCheapest = item.legPriceLkr === minPrice;
    const isEarliest = +new Date(item.fromStop.departureAt) === minDepMs;

    if (isCheapest) tags.push('cheapest');
    if (isEarliest) tags.push('earliest');
    if (isCheapest && isEarliest) tags.push('cheapest_and_earliest');
    if (item.legDurationMinutes === minDuration) tags.push('fastest');
    if (item.isBoostLeg) tags.push('boost');
    return {
      ...item,
      smartTags: tags,
    };
  });
}
