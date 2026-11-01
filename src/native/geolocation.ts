import type { Hub } from '../domain/corridors.ts';
import { ALL_HUBS } from '../domain/corridors.ts';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface NearestHubResult {
  hub: Hub;
  distanceKm: number;
}

/**
 * Calculates great-circle distance between two GPS coordinates using the Haversine formula.
 * @returns distance in kilometers.
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // Earth's mean radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the nearest Sri Lankan transport hub to the provided GPS coordinates.
 * Returns the closest hub and the distance in kilometers rounded to 1 decimal place.
 */
export function findNearestHub(
  coords: Coordinates,
  hubs: readonly Hub[] = ALL_HUBS
): NearestHubResult {
  if (!hubs || hubs.length === 0) {
    throw new Error('No hubs provided to findNearestHub');
  }

  let nearestHub: Hub = hubs[0];
  let minDistance = Infinity;

  for (const hub of hubs) {
    const dist = haversineDistanceKm(coords.latitude, coords.longitude, hub.lat, hub.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestHub = hub;
    }
  }

  const roundedDistance = Math.round(minDistance * 10) / 10;
  return {
    hub: nearestHub,
    distanceKm: roundedDistance,
  };
}

/**
 * Retrieves the device's current GPS location with high accuracy.
 * Attempts Capacitor Geolocation plugin if available, otherwise falls back
 * gracefully to standard browser navigator.geolocation.
 */
export async function getCurrentLocation(): Promise<Coordinates> {
  // 1. Try Capacitor Geolocation plugin if running in native environment
  if (typeof window !== 'undefined' && window.Capacitor?.Plugins?.Geolocation) {
    try {
      const pos = await window.Capacitor.Plugins.Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });
      if (pos?.coords) {
        return {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
      }
    } catch (nativeErr) {
      // Fall through to browser geolocation if native plugin fails
      console.warn('Native geolocation failed, attempting browser fallback:', nativeErr);
    }
  }

  // 2. Browser navigator.geolocation fallback
  if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
    return new Promise<Coordinates>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => {
          reject(new Error(err.message || 'Location permission denied or unavailable'));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }

  throw new Error('Geolocation is not supported in this environment');
}
