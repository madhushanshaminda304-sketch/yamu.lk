import { findRouteOptions } from '../domain/corridors.ts';
import { calculateLegContribution } from '../domain/pricing.ts';
import type { Ride, RideStop } from '../domain/matching.ts';
import type { PublishRideInput, UserProfile } from './types.ts';

export function addMinutesIso(dateStr: string, timeStr: string, minutesToAdd: number): string {
  const base = new Date(`${dateStr}T${timeStr}:00+05:30`);
  const target = new Date(base.getTime() + minutesToAdd * 60000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const localParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(target);
  const get = (t: string) => localParts.find((p) => p.type === t)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}T${pad(Number(get('hour')) % 24)}:${get('minute')}:00+05:30`;
}

export function buildReturnRide(
  input: PublishRideInput,
  outboundRide: Ride,
  currentUser: UserProfile,
  clampedPriceLkr: number,
  recommendedLkr: number
): Ride {
  if (!input.returnDate || !input.returnTime) {
    throw new Error('Return date and return departure time are required.');
  }
  const outboundArrivalMs = new Date(outboundRide.arrivalAt).getTime();
  const returnDepartureMs = new Date(`${input.returnDate}T${input.returnTime}:00+05:30`).getTime();
  if (returnDepartureMs < outboundArrivalMs + 30 * 60 * 1000) {
    throw new Error('Return departure must be at least 30 minutes after outbound arrival.');
  }

  const returnRoutes = findRouteOptions(input.destinationHubId, input.originHubId);
  const selectedReturnRoute =
    returnRoutes.find((r) => r.corridorId === outboundRide.corridorId) ?? returnRoutes[0];
  if (!selectedReturnRoute) {
    throw new Error('Could not compute return route along corridor.');
  }

  const filteredReturnStops = selectedReturnRoute.stops.filter((s, idx, arr) => {
    if (idx === 0 || idx === arr.length - 1) return true;
    return input.selectedStopoverHubIds.includes(s.hubId) || input.boostEnabled;
  });

  const returnStops: RideStop[] = filteredReturnStops.map((s, idx, arr) => {
    const isFirst = idx === 0;
    const isLast = idx === arr.length - 1;
    const arrivalIso = addMinutesIso(input.returnDate!, input.returnTime!, s.minutesFromOrigin);
    const departureIso =
      isFirst || isLast
        ? arrivalIso
        : addMinutesIso(input.returnDate!, input.returnTime!, s.minutesFromOrigin + 4);
    const priceFromOriginLkr = isFirst
      ? 0
      : isLast
        ? clampedPriceLkr
        : calculateLegContribution(clampedPriceLkr, selectedReturnRoute.distanceKm, s.kmFromOrigin);

    return {
      hubId: s.hubId,
      stopIndex: idx,
      arrivalAt: arrivalIso,
      departureAt: departureIso,
      kmFromOrigin: s.kmFromOrigin,
      priceFromOriginLkr,
      pickupLandmark: isFirst
        ? input.dropoffLandmark || s.defaultLandmark
        : isLast
          ? input.pickupLandmark || s.defaultLandmark
          : s.defaultLandmark,
      isBoostStop: !isFirst && !isLast && !input.selectedStopoverHubIds.includes(s.hubId),
    };
  });

  return {
    id: `ride-${Date.now() + 1}-${Math.random().toString(36).slice(2, 6)}`,
    driverId: currentUser.id,
    corridorId: selectedReturnRoute.corridorId,
    corridorCode: selectedReturnRoute.corridorCode,
    corridorName: selectedReturnRoute.corridorName,
    hasTolls: selectedReturnRoute.hasTolls,
    tollPolicy: input.tollPolicy,
    estimatedTollLkr: selectedReturnRoute.estimatedTollLkr,
    originHubId: input.destinationHubId,
    destinationHubId: input.originHubId,
    departureDate: input.returnDate,
    departureAt: returnStops[0].departureAt,
    arrivalAt: returnStops[returnStops.length - 1].arrivalAt,
    totalDistanceKm: selectedReturnRoute.distanceKm,
    fullPriceLkr: clampedPriceLkr,
    recommendedPriceLkr: recommendedLkr,
    totalSeats: input.seats,
    segmentSeatsAvailable: Array.from({ length: returnStops.length - 1 }, () => input.seats),
    stops: returnStops,
    approvalMode: input.approvalMode,
    boostEnabled: input.boostEnabled,
    luggageCapacity: input.luggageCapacity ?? input.comfort.luggage ?? 'medium',
    vehicle: outboundRide.vehicle,
    comfort: input.comfort,
    driver: outboundRide.driver,
    notes: input.notes ? `${input.notes} (Return journey)` : 'Return journey',
    status: 'published',
  };
}
