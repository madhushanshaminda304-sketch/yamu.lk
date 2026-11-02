import { haversineDistanceKm } from '../native/geolocation.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import type { LatLngTuple } from './routeMapGeometry.ts';

export interface LatLngPoint {
  lat: number;
  lng: number;
}

export interface LiveParticipantLocation {
  rideId: string;
  userId: string;
  userName: string;
  role: 'driver' | 'passenger';
  lat: number;
  lng: number;
  statusText?: string;
  updatedAt: number;
}

export interface ProximitySummary {
  distanceKm: number;
  distanceMeters: number;
  etaMinutes: number;
  walkingMinutes: number;
  isArrivingSoon: boolean;
}

export const DRIVER_QUICK_STATUS_CHIPS: readonly string[] = [
  '🚗 Leaving now',
  '🚦 Stuck in traffic (+5m)',
  '📍 I am at the pickup spot',
  '🅿️ Waiting near main entrance',
];

export const PASSENGER_QUICK_STATUS_CHIPS: readonly string[] = [
  '🙋‍♂️ I am at the pickup point',
  '🏃‍♂️ Walking to pickup (2m)',
  '👕 Waiting by roadside landmark',
  '👍 Ready with Boarding PIN',
];

/**
 * Calculates real-time distance, driving ETA (~35 km/h urban/suburban approach),
 * walking time (~4.8 km/h), and triggers `isArrivingSoon` when < 500m.
 */
export function computeProximitySummary(
  pointA: LatLngPoint,
  pointB: LatLngPoint
): ProximitySummary {
  const rawKm = haversineDistanceKm(pointA.lat, pointA.lng, pointB.lat, pointB.lng);
  const distanceKm = Math.round(rawKm * 100) / 100;
  const distanceMeters = Math.round(distanceKm * 1000);
  const etaMinutes = Math.max(1, Math.round((rawKm / 35) * 60));
  const walkingMinutes = Math.max(1, Math.round((rawKm / 4.8) * 60));
  const isArrivingSoon = rawKm < 0.5;

  return {
    distanceKm,
    distanceMeters,
    etaMinutes,
    walkingMinutes,
    isArrivingSoon,
  };
}

/**
 * Smoothly interpolates a [lat, lng] coordinate at `progress` (0.0 to 1.0)
 * along a multi-segment route polyline.
 */
export function interpolatePositionAlongPolyline(
  positions: readonly LatLngTuple[],
  progress: number
): LatLngTuple {
  if (positions.length === 0) return [6.9271, 79.8612];
  if (positions.length === 1) return positions[0];

  const clamped = Math.max(0, Math.min(1, progress));
  if (clamped === 0) return positions[0];
  if (clamped === 1) return positions[positions.length - 1];

  const totalSegments = positions.length - 1;
  const exactIndex = clamped * totalSegments;
  const segIndex = Math.min(Math.floor(exactIndex), totalSegments - 1);
  const segFraction = exactIndex - segIndex;

  const [lat1, lng1] = positions[segIndex];
  const [lat2, lng2] = positions[segIndex + 1];

  return [
    lat1 + (lat2 - lat1) * segFraction,
    lng1 + (lng2 - lng1) * segFraction,
  ];
}

/**
 * Builds a multi-stop Google Maps turn-by-turn navigation URL including intermediate stopovers.
 */
export function buildMultiStopGoogleMapsUrl(points: readonly LatLngPoint[]): string {
  if (points.length === 0) return 'https://www.google.com/maps';
  if (points.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${points[0].lat},${points[0].lng}`;
  }

  const origin = `${points[0].lat},${points[0].lng}`;
  const destination = `${points[points.length - 1].lat},${points[points.length - 1].lng}`;
  const middle = points.slice(1, -1);
  const waypointsParam =
    middle.length > 0
      ? `&waypoints=${middle.map((p) => `${p.lat},${p.lng}`).join('|')}`
      : '';

  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointsParam}&travelmode=driving`;
}

/**
 * Builds a Waze deep-link turn-by-turn navigation URL for Sri Lankan drivers.
 */
export function buildWazeNavigationUrl(destination: LatLngPoint): string {
  return `https://waze.com/ul?ll=${destination.lat},${destination.lng}&navigate=yes`;
}

/**
 * In-memory + BroadcastChannel + Supabase Realtime room bus so Driver and Passenger
 * see each other's live motion across devices AND across local browser tabs.
 */
export function createLocalLiveRoomBus() {
  const listeners = new Map<string, Set<(loc: LiveParticipantLocation) => void>>();
  const latestByRide = new Map<string, Map<string, LiveParticipantLocation>>();

  const notifyLocal = (payload: LiveParticipantLocation) => {
    let rideMap = latestByRide.get(payload.rideId);
    if (!rideMap) {
      rideMap = new Map();
      latestByRide.set(payload.rideId, rideMap);
    }
    rideMap.set(`${payload.role}:${payload.userId}`, payload);

    const roomSet = listeners.get(payload.rideId);
    if (roomSet) {
      for (const cb of roomSet) {
        cb(payload);
      }
    }
  };

  return {
    publish(payload: LiveParticipantLocation): void {
      notifyLocal(payload);
    },
    subscribe(
      rideId: string,
      callback: (loc: LiveParticipantLocation) => void
    ): () => void {
      let roomSet = listeners.get(rideId);
      if (!roomSet) {
        roomSet = new Set();
        listeners.set(rideId, roomSet);
      }
      roomSet.add(callback);

      const existing = latestByRide.get(rideId);
      if (existing) {
        for (const loc of existing.values()) {
          callback(loc);
        }
      }

      return () => {
        roomSet?.delete(callback);
      };
    },
  };
}

const globalRoomBus = createLocalLiveRoomBus();

/**
 * Subscribes to a live ride room via both browser BroadcastChannel (for multi-tab testing)
 * and Supabase Realtime Broadcast (for cross-device driver <-> customer tracking).
 */
export function joinLiveRideRoom(
  rideId: string,
  onLocationUpdate: (loc: LiveParticipantLocation) => void
): {
  broadcastLocation: (loc: LiveParticipantLocation) => void;
  leave: () => void;
} {
  const unsubLocal = globalRoomBus.subscribe(rideId, onLocationUpdate);

  // 1. Cross-tab BroadcastChannel support
  let bc: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      bc = new BroadcastChannel(`yamo_live_ride_${rideId}`);
      bc.onmessage = (event: MessageEvent<LiveParticipantLocation>) => {
        if (event?.data?.rideId === rideId) {
          globalRoomBus.publish(event.data);
        }
      };
    } catch {
      bc = null;
    }
  }

  // 2. Supabase Realtime WebSocket Broadcast channel
  let supabaseChannel: ReturnType<typeof supabase.channel> | null = null;
  if (isSupabaseConfigured()) {
    try {
      supabaseChannel = supabase.channel(`yamo_live_ride_${rideId}`, {
        config: { broadcast: { self: false } },
      });
      supabaseChannel
        .on('broadcast', { event: 'location_ping' }, (envelope) => {
          const payload = envelope?.payload as LiveParticipantLocation | undefined;
          if (payload && payload.rideId === rideId) {
            globalRoomBus.publish(payload);
          }
        })
        .subscribe();
    } catch {
      supabaseChannel = null;
    }
  }

  return {
    broadcastLocation(loc: LiveParticipantLocation) {
      globalRoomBus.publish(loc);
      try {
        bc?.postMessage(loc);
      } catch {
        // Ignore closed channel
      }
      if (supabaseChannel) {
        void supabaseChannel.send({
          type: 'broadcast',
          event: 'location_ping',
          payload: loc,
        });
      }
    },
    leave() {
      unsubLocal();
      try {
        bc?.close();
      } catch {
        // Ignore
      }
      if (supabaseChannel) {
        void supabase.removeChannel(supabaseChannel);
      }
    },
  };
}
