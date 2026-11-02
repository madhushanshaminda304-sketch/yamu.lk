import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  computeMapBounds,
  fetchRoutePolylineWithFallback,
  type LatLngTuple,
  type RouteMapWaypoint,
} from '../domain/routeMapGeometry.ts';
import {
  computeProximitySummary,
  interpolatePositionAlongPolyline,
  buildMultiStopGoogleMapsUrl,
  buildWazeNavigationUrl,
  joinLiveRideRoom,
  DRIVER_QUICK_STATUS_CHIPS,
  PASSENGER_QUICK_STATUS_CHIPS,
  type LiveParticipantLocation,
} from '../domain/liveTracking.ts';
import { watchLiveLocation } from '../native/geolocation.ts';
import { triggerHaptic } from '../native/haptics.ts';
import { formatColomboTime } from '../domain/i18n.ts';

interface LeafletRouteMapProps {
  waypoints: readonly RouteMapWaypoint[];
  height?: number;
  rideId?: string;
  currentUserId?: string;
  currentUserName?: string;
  userRole?: 'driver' | 'passenger';
  enableLiveTracking?: boolean;
  journeyStatus?: 'scheduled' | 'departed' | 'completed';
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildTaxiWaypointIcon(wp: RouteMapWaypoint, index: number): L.DivIcon {
  const isPickup = wp.isSelectedFrom || (wp.isOrigin && !wp.isSelectedTo);
  const isDropoff = wp.isSelectedTo || (wp.isDestination && !wp.isSelectedFrom);
  const timeStr = wp.departureAt ? formatColomboTime(wp.departureAt) : '';

  if (isPickup || isDropoff) {
    const bg = isPickup ? '#047857' : '#0f172a';
    const dotBg = isPickup ? '#34d399' : '#f59e0b';
    const tag = isPickup ? 'PICKUP' : 'DROP-OFF';

    const html = `
      <div style="
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: ${bg};
        color: #ffffff;
        padding: 4px 10px;
        border-radius: 9999px;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.28);
        font-family: Inter, system-ui, sans-serif;
        white-space: nowrap;
        transform: translate(-50%, -100%);
      ">
        <span style="width: 8px; height: 8px; border-radius: 9999px; background: ${dotBg}; flex-shrink: 0;"></span>
        <span style="font-size: 10px; font-weight: 800; letter-spacing: 0.04em; opacity: 0.9;">${tag}</span>
        <span style="font-size: 11px; font-weight: 800;">${escapeHtml(wp.name)}</span>
        ${timeStr ? `<span style="font-size: 10px; font-weight: 600; background: rgba(255,255,255,0.18); padding: 1px 5px; border-radius: 4px;">${escapeHtml(timeStr)}</span>` : ''}
      </div>
    `;

    return L.divIcon({
      className: 'yamo-taxi-pill-pin',
      html,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
      popupAnchor: [0, -28],
    });
  }

  const html = `
    <div style="
      width: 22px;
      height: 22px;
      border-radius: 9999px;
      background: #ffffff;
      border: 3px solid #047857;
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.22);
      color: #064e3b;
      font-family: Inter, system-ui, sans-serif;
      font-size: 10px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    ">${index + 1}</div>
  `;

  return L.divIcon({
    className: 'yamo-stopover-pin',
    html,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });
}

function buildLiveParticipantIcon(loc: LiveParticipantLocation): L.DivIcon {
  const isDriver = loc.role === 'driver';
  const bg = isDriver ? '#064e3b' : '#0284c7';
  const emoji = isDriver ? '🚗' : '🧍‍♂️';
  const label = isDriver ? `${loc.userName} (Driver)` : `${loc.userName} (Rider)`;

  const html = `
    <div style="
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      transform: translate(-50%, -50%);
      font-family: Inter, system-ui, sans-serif;
    ">
      <div style="
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: ${bg};
        color: #ffffff;
        padding: 4px 10px;
        border-radius: 9999px;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 14px rgba(0,0,0,0.32);
        white-space: nowrap;
        font-size: 11px;
        font-weight: 800;
      ">
        <span style="font-size: 14px;">${emoji}</span>
        <span>${escapeHtml(label)}</span>
      </div>
      ${
        loc.statusText
          ? `<div style="
              margin-top: 3px;
              background: #fef3c7;
              color: #92400e;
              border: 1px solid #fde68a;
              font-size: 10px;
              font-weight: 700;
              padding: 1px 7px;
              border-radius: 9999px;
              white-space: nowrap;
              box-shadow: 0 2px 5px rgba(0,0,0,0.12);
            ">${escapeHtml(loc.statusText)}</div>`
          : ''
      }
    </div>
  `;

  return L.divIcon({
    className: 'yamo-live-motion-pin',
    html,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

export function LeafletRouteMap({
  waypoints,
  height = 310,
  rideId,
  currentUserId = 'guest-user',
  currentUserName = 'You',
  userRole = 'passenger',
  enableLiveTracking = true,
  journeyStatus = 'scheduled',
}: LeafletRouteMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const liveLayerRef = useRef<L.LayerGroup | null>(null);
  const roomRef = useRef<ReturnType<typeof joinLiveRideRoom> | null>(null);

  const [routePositions, setRoutePositions] = useState<LatLngTuple[]>([]);
  const [routeSource, setRouteSource] = useState<'osrm' | 'fallback' | 'loading'>('loading');
  const [isSharingGps, setIsSharingGps] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeStatusText, setActiveStatusText] = useState<string>('');
  const [driverLive, setDriverLive] = useState<LiveParticipantLocation | null>(null);
  const [passengerLive, setPassengerLive] = useState<LiveParticipantLocation | null>(null);

  // Initialize Clean Taxi Map WITHOUT Leaflet Ukrainian Flag Attribution
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = L.map(container, {
      center: [7.2906, 80.6337],
      zoom: 8,
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: false, // Removes default Leaflet 🇺🇦 flag badge
    });

    // Clean commercial-grade Taxi Vector-Style Basemap (CARTO Voyager clean streets)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    routeLayerRef.current = L.layerGroup().addTo(map);
    liveLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      routeLayerRef.current = null;
      liveLayerRef.current = null;
    };
  }, []);

  // Draw Highway Route & Floating Taxi Pills
  useEffect(() => {
    const map = mapRef.current;
    const group = routeLayerRef.current;
    if (!map || !group || waypoints.length === 0) return;

    let cancelled = false;
    group.clearLayers();
    setRouteSource('loading');

    waypoints.forEach((wp, index) => {
      const icon = buildTaxiWaypointIcon(wp, index);
      const timeLabel = wp.departureAt ? formatColomboTime(wp.departureAt) : '';
      const roleTag = wp.isSelectedFrom
        ? 'Your Pickup'
        : wp.isSelectedTo
        ? 'Your Drop-off'
        : wp.isOrigin
        ? 'Route Origin'
        : wp.isDestination
        ? 'Route Destination'
        : 'Stopover Hub';

      const popupHtml = `
        <div style="font-family: Inter, system-ui, sans-serif; min-width: 175px; line-height: 1.4;">
          <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #047857; margin-bottom: 2px;">
            ${escapeHtml(roleTag)} ${timeLabel ? `• ${escapeHtml(timeLabel)}` : ''}
          </div>
          <div style="font-size: 13px; font-weight: 800; color: #0f172a;">
            ${escapeHtml(wp.name)}
          </div>
          <div style="font-size: 11px; color: #475569; margin-top: 2px;">
            📍 ${escapeHtml(wp.landmark)}
          </div>
          <div style="font-size: 10px; color: #64748b; margin-top: 4px;">
            ${wp.kmFromOrigin} km from origin
          </div>
        </div>
      `;

      L.marker([wp.lat, wp.lng], { icon })
        .bindPopup(popupHtml)
        .addTo(group);
    });

    const bounds = computeMapBounds(waypoints);
    if (bounds) {
      map.fitBounds(bounds, { padding: [42, 42], maxZoom: 13 });
    }

    void fetchRoutePolylineWithFallback(waypoints).then(({ positions, source }) => {
      if (cancelled || !mapRef.current || !routeLayerRef.current) return;
      setRouteSource(source);
      setRoutePositions(positions);

      if (positions.length >= 2) {
        // Dark Emerald Casing (Uber/Yandex highway glow)
        L.polyline(positions, {
          color: '#064e3b',
          weight: 8,
          opacity: 0.28,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(group);

        // Crisp Ceylon Emerald Active Route Line
        const poly = L.polyline(positions, {
          color: '#059669',
          weight: 5,
          opacity: 0.96,
          dashArray: source === 'fallback' ? '8, 6' : undefined,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(group);

        map.fitBounds(poly.getBounds(), { padding: [42, 42], maxZoom: 13 });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [waypoints]);

  // Connect to Real-Time Driver <-> Passenger Room (Supabase Realtime + BroadcastChannel)
  useEffect(() => {
    if (!enableLiveTracking || !rideId) return;

    const room = joinLiveRideRoom(rideId, (loc) => {
      if (loc.role === 'driver') {
        setDriverLive(loc);
      } else {
        setPassengerLive(loc);
      }
    });
    roomRef.current = room;

    return () => {
      room.leave();
      roomRef.current = null;
    };
  }, [enableLiveTracking, rideId]);

  // Real-Time GPS Watch Effect when user toggles "Share My Live Location"
  useEffect(() => {
    if (!isSharingGps || !rideId) return;

    const stopWatch = watchLiveLocation(
      (coords) => {
        const ping: LiveParticipantLocation = {
          rideId,
          userId: currentUserId,
          userName: currentUserName,
          role: userRole,
          lat: coords.latitude,
          lng: coords.longitude,
          statusText: activeStatusText || undefined,
          updatedAt: Date.now(),
        };
        roomRef.current?.broadcastLocation(ping);
      },
      () => {
        // Fallback if desktop browser blocks geolocation: place near pickup waypoint
        const pickup = waypoints.find((w) => w.isSelectedFrom) || waypoints[0];
        if (pickup) {
          const fallbackPing: LiveParticipantLocation = {
            rideId,
            userId: currentUserId,
            userName: currentUserName,
            role: userRole,
            lat: pickup.lat + (userRole === 'passenger' ? 0.0022 : -0.004),
            lng: pickup.lng + (userRole === 'passenger' ? 0.0018 : -0.003),
            statusText: activeStatusText || undefined,
            updatedAt: Date.now(),
          };
          roomRef.current?.broadcastLocation(fallbackPing);
        }
      }
    );

    return () => {
      stopWatch();
    };
  }, [isSharingGps, rideId, currentUserId, currentUserName, userRole, activeStatusText, waypoints]);

  // Demo "Simulate Live Motion" Effect so user can watch Driver & Customer move toward each other
  useEffect(() => {
    if (!isSimulating || routePositions.length < 2) return;

    const pickup = waypoints.find((w) => w.isSelectedFrom) || waypoints[0];
    const effectiveRideId = rideId || 'demo-ride';

    // Place passenger waiting 180m from pickup hub
    if (pickup) {
      const passengerPing: LiveParticipantLocation = {
        rideId: effectiveRideId,
        userId: 'sim-passenger',
        userName: userRole === 'passenger' ? currentUserName : 'Nimali (Passenger)',
        role: 'passenger',
        lat: pickup.lat + 0.0014,
        lng: pickup.lng + 0.0012,
        statusText: activeStatusText || '🙋‍♂️ Waiting at pickup point',
        updatedAt: Date.now(),
      };
      setPassengerLive(passengerPing);
      roomRef.current?.broadcastLocation(passengerPing);
    }

    let step = 0;
    const totalSteps = 25;
    const timer = setInterval(() => {
      step = (step + 1) % (totalSteps + 1);
      const progress = step / totalSteps;
      const [lat, lng] = interpolatePositionAlongPolyline(routePositions, progress);

      const driverPing: LiveParticipantLocation = {
        rideId: effectiveRideId,
        userId: 'sim-driver',
        userName: userRole === 'driver' ? currentUserName : 'Driver',
        role: 'driver',
        lat,
        lng,
        statusText: progress < 0.2 ? '🚗 Approaching pickup' : progress > 0.85 ? '🏁 Arriving at destination' : '🛣️ En route on highway',
        updatedAt: Date.now(),
      };
      setDriverLive(driverPing);
      roomRef.current?.broadcastLocation(driverPing);
    }, 900);

    return () => {
      clearInterval(timer);
    };
  }, [isSimulating, routePositions, waypoints, rideId, userRole, currentUserName, activeStatusText]);

  // Render Live Moving Markers + Dotted Walking Path on `liveLayerRef`
  useEffect(() => {
    const group = liveLayerRef.current;
    if (!group) return;
    group.clearLayers();

    const pickup = waypoints.find((w) => w.isSelectedFrom) || waypoints[0];

    if (passengerLive) {
      L.marker([passengerLive.lat, passengerLive.lng], {
        icon: buildLiveParticipantIcon(passengerLive),
        zIndexOffset: 900,
      }).addTo(group);

      // Draw dotted walking line from Passenger live dot to Pickup Pin
      if (pickup) {
        L.polyline(
          [
            [passengerLive.lat, passengerLive.lng],
            [pickup.lat, pickup.lng],
          ],
          {
            color: '#0284c7',
            weight: 3,
            dashArray: '4, 6',
            opacity: 0.85,
          }
        ).addTo(group);
      }
    }

    if (driverLive) {
      L.marker([driverLive.lat, driverLive.lng], {
        icon: buildLiveParticipantIcon(driverLive),
        zIndexOffset: 1000,
      }).addTo(group);
    }
  }, [driverLive, passengerLive, waypoints]);

  const pickupWp = waypoints.find((w) => w.isSelectedFrom) || waypoints[0];
  const dropoffWp = waypoints.find((w) => w.isSelectedTo) || waypoints[waypoints.length - 1];

  // Calculate live proximity between Driver and Passenger (or Driver/Passenger to Pickup)
  const proximity =
    driverLive && passengerLive
      ? computeProximitySummary(driverLive, passengerLive)
      : driverLive && pickupWp
      ? computeProximitySummary(driverLive, pickupWp)
      : passengerLive && pickupWp
      ? computeProximitySummary(passengerLive, pickupWp)
      : null;

  const googleMapsUrl = buildMultiStopGoogleMapsUrl(waypoints);
  const wazeUrl = dropoffWp ? buildWazeNavigationUrl(dropoffWp) : null;
  const quickChips = userRole === 'driver' ? DRIVER_QUICK_STATUS_CHIPS : PASSENGER_QUICK_STATUS_CHIPS;

  const handleBroadcastChip = (chipText: string) => {
    void triggerHaptic('selection');
    setActiveStatusText(chipText);
    const baseLoc = userRole === 'driver' ? driverLive : passengerLive;
    const refWp = pickupWp || waypoints[0];
    if (!refWp) return;

    const updated: LiveParticipantLocation = {
      rideId: rideId || 'demo-ride',
      userId: currentUserId,
      userName: currentUserName,
      role: userRole,
      lat: baseLoc ? baseLoc.lat : refWp.lat + 0.001,
      lng: baseLoc ? baseLoc.lng : refWp.lng + 0.001,
      statusText: chipText,
      updatedAt: Date.now(),
    };
    if (userRole === 'driver') {
      setDriverLive(updated);
    } else {
      setPassengerLive(updated);
    }
    roomRef.current?.broadcastLocation(updated);
  };

  return (
    <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid #cbd5e1', background: '#ffffff', boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)' }}>
      {/* Top Live Radar Control Bar */}
      {enableLiveTracking && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            padding: '10px 14px',
            background: '#0f172a',
            color: '#ffffff',
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '9999px',
                background: isSharingGps || isSimulating || journeyStatus === 'departed' ? '#10b981' : '#94a3b8',
                boxShadow: isSharingGps || isSimulating ? '0 0 0 4px rgba(16, 185, 129, 0.25)' : 'none',
              }}
            />
            <strong style={{ fontSize: '12px', letterSpacing: '0.01em' }}>
              {isSharingGps || isSimulating
                ? 'Live Driver & Rider Motion Active'
                : 'Live Pickup & Route Radar'}
            </strong>
            {proximity && (
              <span
                style={{
                  background: proximity.isArrivingSoon ? '#f59e0b' : 'rgba(255,255,255,0.14)',
                  color: proximity.isArrivingSoon ? '#0f172a' : '#e2e8f0',
                  fontWeight: 800,
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                }}
              >
                {proximity.isArrivingSoon
                  ? `🔔 Arriving! ${proximity.distanceMeters}m away (~1 min)`
                  : `🚗 ↔ 🧍‍♂️ ${proximity.distanceKm} km (~${proximity.etaMinutes} min)`}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => {
                void triggerHaptic('selection');
                setIsSharingGps((prev) => !prev);
              }}
              style={{
                border: 'none',
                borderRadius: '9999px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                background: isSharingGps ? '#10b981' : 'rgba(255,255,255,0.15)',
                color: '#ffffff',
              }}
            >
              {isSharingGps ? '📡 Sharing My GPS: ON' : '📍 Share My Live Location'}
            </button>

            <button
              type="button"
              onClick={() => {
                void triggerHaptic('selection');
                setIsSimulating((prev) => !prev);
              }}
              style={{
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: '9999px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                background: isSimulating ? '#f59e0b' : 'transparent',
                color: isSimulating ? '#0f172a' : '#cbd5e1',
              }}
              title="Preview live moving Driver car and Passenger pin on the map"
            >
              {isSimulating ? '⏹ Stop Demo' : '▶️ Demo Live Motion'}
            </button>
          </div>
        </div>
      )}

      {/* Map Canvas */}
      <div style={{ position: 'relative' }}>
        <div
          ref={containerRef}
          style={{
            width: '100%',
            height: `${height}px`,
            background: '#f1f5f9',
            zIndex: 1,
          }}
          aria-label="Interactive Sri Lanka taxi & carpool route map"
        />
        {/* Subtle minimal copyright without any flag */}
        <div
          style={{
            position: 'absolute',
            bottom: '4px',
            right: '6px',
            zIndex: 400,
            fontSize: '9px',
            color: '#64748b',
            background: 'rgba(255,255,255,0.75)',
            padding: '1px 5px',
            borderRadius: '4px',
            pointerEvents: 'none',
          }}
        >
          © OpenStreetMap · CARTO
        </div>
      </div>

      {/* 1-Tap Quick Status Chips for Driver & Passenger Convenience */}
      {enableLiveTracking && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            overflowX: 'auto',
            padding: '8px 12px',
            background: '#f0fdf4',
            borderTop: '1px solid #d1fae5',
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#064e3b', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            Quick Status:
          </span>
          {quickChips.map((chip) => {
            const isSelected = activeStatusText === chip;
            return (
              <button
                key={chip}
                type="button"
                onClick={() => handleBroadcastChip(chip)}
                style={{
                  border: isSelected ? '1px solid #047857' : '1px solid #a7f3d0',
                  background: isSelected ? '#047857' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#064e3b',
                  borderRadius: '9999px',
                  padding: '3px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {chip}
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom Navigation & Turn-by-Turn Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '8px 12px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          fontSize: '11px',
          color: '#475569',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#047857' }}>
            🟢 Pickup: {pickupWp?.name}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#0f172a' }}>
            🏁 Drop-off: {dropoffWp?.name}
          </span>
          <span style={{ color: '#64748b' }}>
            {routeSource === 'osrm'
              ? '🛣️ Highway Route'
              : routeSource === 'loading'
              ? '⏳ Loading route…'
              : '📍 Corridor Path'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: '#047857',
              textDecoration: 'none',
            }}
          >
            🧭 Google Maps ↗
          </a>
          {wazeUrl && (
            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#0284c7',
                textDecoration: 'none',
              }}
            >
              🚗 Waze ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
