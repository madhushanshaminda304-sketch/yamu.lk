import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  computeMapBounds,
  fetchRoutePolylineWithFallback,
  type RouteMapWaypoint,
} from '../domain/routeMapGeometry.ts';
import { formatColomboTime } from '../domain/i18n.ts';

interface LeafletRouteMapProps {
  waypoints: readonly RouteMapWaypoint[];
  height?: number;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildMarkerIcon(wp: RouteMapWaypoint, index: number): L.DivIcon {
  const isSelected = wp.isSelectedFrom || wp.isSelectedTo;
  const isEndpoint = wp.isOrigin || wp.isDestination;

  let bg = '#10b981';
  let border = '#ffffff';
  let size = 24;
  let badgeText = String(index + 1);

  if (wp.isSelectedFrom) {
    bg = '#047857';
    size = 30;
    badgeText = 'A';
  } else if (wp.isSelectedTo) {
    bg = '#d97706';
    size = 30;
    badgeText = 'B';
  } else if (isEndpoint) {
    bg = '#064e3b';
    size = 26;
  }

  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 9999px;
      background: ${bg};
      border: 3px solid ${border};
      box-shadow: 0 2px 6px rgba(6, 78, 59, 0.35);
      color: #ffffff;
      font-family: Inter, system-ui, sans-serif;
      font-size: ${isSelected ? '12px' : '11px'};
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    ">${badgeText}</div>
  `;

  return L.divIcon({
    className: 'yamo-route-pin',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export function LeafletRouteMap({ waypoints, height = 280 }: LeafletRouteMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const [routeSource, setRouteSource] = useState<'osrm' | 'fallback' | 'loading'>('loading');

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = L.map(container, {
      center: [7.2906, 80.6337], // Sri Lanka center default
      zoom: 8,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    const group = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerGroupRef.current = group;

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!map || !group || waypoints.length === 0) return;

    let cancelled = false;
    group.clearLayers();
    setRouteSource('loading');

    // Add markers for each stopover
    waypoints.forEach((wp, index) => {
      const icon = buildMarkerIcon(wp, index);
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
        <div style="font-family: Inter, system-ui, sans-serif; min-width: 170px; line-height: 1.35;">
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
            ${wp.kmFromOrigin} km from start
          </div>
        </div>
      `;

      L.marker([wp.lat, wp.lng], { icon })
        .bindPopup(popupHtml)
        .addTo(group);
    });

    // Fit initial bounds from waypoints
    const bounds = computeMapBounds(waypoints);
    if (bounds) {
      map.fitBounds(bounds, { padding: [32, 32], maxZoom: 13 });
    }

    // Fetch live OSRM road geometry or fallback to hub-to-hub polyline
    void fetchRoutePolylineWithFallback(waypoints).then(({ positions, source }) => {
      if (cancelled || !mapRef.current || !layerGroupRef.current) return;
      setRouteSource(source);

      if (positions.length >= 2) {
        // Outer casing for contrast over map tiles
        L.polyline(positions, {
          color: '#064e3b',
          weight: 7,
          opacity: 0.35,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(group);

        // Inner Ceylon Emerald route line
        const poly = L.polyline(positions, {
          color: '#047857',
          weight: 4.5,
          opacity: 0.92,
          dashArray: source === 'fallback' ? '8, 6' : undefined,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(group);

        map.fitBounds(poly.getBounds(), { padding: [32, 32], maxZoom: 13 });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [waypoints]);

  const pickupWp = waypoints.find((w) => w.isSelectedFrom) || waypoints[0];
  const dropoffWp = waypoints.find((w) => w.isSelectedTo) || waypoints[waypoints.length - 1];

  const googleMapsDirectionsUrl =
    pickupWp && dropoffWp
      ? `https://www.google.com/maps/dir/?api=1&origin=${pickupWp.lat},${pickupWp.lng}&destination=${dropoffWp.lat},${dropoffWp.lng}&travelmode=driving`
      : null;

  return (
    <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid #a7f3d0' }}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: `${height}px`,
          background: '#ecfdf5',
          zIndex: 1,
        }}
        aria-label="Interactive Sri Lanka corridor route map"
      />
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
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#064e3b' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '9999px', background: '#047857', display: 'inline-block' }} />
            A: {pickupWp?.name}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#92400e' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '9999px', background: '#d97706', display: 'inline-block' }} />
            B: {dropoffWp?.name}
          </span>
          <span style={{ color: '#64748b' }}>
            {routeSource === 'osrm'
              ? '🛣️ Highway geometry (OSRM)'
              : routeSource === 'loading'
              ? '⏳ Tracing route…'
              : '📍 Direct corridor path'}
          </span>
        </div>

        {googleMapsDirectionsUrl && (
          <a
            href={googleMapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#047857',
              textDecoration: 'none',
            }}
          >
            Open in Google Maps ↗
          </a>
        )}
      </div>
    </div>
  );
}
