import React from 'react';
import type { Ride, RideStop } from '../domain/matching.ts';
import { getHubById } from '../domain/corridors.ts';

interface RouteCorridorMapProps {
  ride: Ride;
  selectedFromHubId?: string;
  selectedToHubId?: string;
  langKey?: 'en' | 'si' | 'ta';
}

export function RouteCorridorMap({
  ride,
  selectedFromHubId,
  selectedToHubId,
  langKey = 'en',
}: RouteCorridorMapProps) {
  const stops = ride.stops;
  if (!stops || stops.length === 0) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)',
        border: '1px solid #d1fae5',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        marginBottom: '20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.05em',
              background: '#064e3b',
              color: '#ffffff',
              padding: '2px 8px',
              borderRadius: '4px',
            }}
          >
            {ride.corridorCode}
          </span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#064e3b' }}>
            {ride.corridorName}
          </span>
        </div>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#047857' }}>
          {stops[stops.length - 1].kmFromOrigin} km total
        </span>
      </div>

      {/* Visual Corridor Timeline (Scrollable on small mobile screens for multi-stop routes) */}
      <div style={{ position: 'relative', overflowX: 'auto', padding: '16px 8px 12px', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ position: 'relative', minWidth: stops.length > 3 ? `${stops.length * 110}px` : '100%' }}>
          {/* Progress Bar Track */}
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '16px',
              right: '16px',
              height: '6px',
              background: '#e2e8f0',
              borderRadius: '9999px',
              zIndex: 1,
            }}
          >
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #059669 0%, #10b981 100%)',
                borderRadius: '9999px',
                width: '100%',
              }}
            />
          </div>

          {/* Stops distribution along track */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {stops.map((stop: RideStop, idx: number) => {
              const hub = getHubById(stop.hubId);
              const hubName = hub?.name[langKey] || hub?.name.en || stop.hubId;
              const isOrigin = idx === 0;
              const isDest = idx === stops.length - 1;
              const isFrom = stop.hubId === selectedFromHubId;
              const isTo = stop.hubId === selectedToHubId;
              const isHighlight = isFrom || isTo;

              return (
                <div
                  key={stop.hubId}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: idx === 0 ? 'flex-start' : idx === stops.length - 1 ? 'flex-end' : 'center',
                    maxWidth: '100px',
                    textAlign: idx === 0 ? 'left' : idx === stops.length - 1 ? 'right' : 'center',
                  }}
                >
                  {/* Node Dot */}
                  <div
                    style={{
                      width: isHighlight ? '18px' : isOrigin || isDest ? '14px' : '10px',
                      height: isHighlight ? '18px' : isOrigin || isDest ? '14px' : '10px',
                      borderRadius: '9999px',
                      background: isHighlight ? '#047857' : isOrigin || isDest ? '#064e3b' : '#10b981',
                      border: '3px solid #ffffff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      marginBottom: '8px',
                    }}
                  />

                  {/* Hub Label */}
                  <span
                    style={{
                      fontSize: isHighlight ? '12px' : '11px',
                      fontWeight: isHighlight ? 800 : 600,
                      color: isHighlight ? '#064e3b' : '#334155',
                      lineHeight: 1.2,
                    }}
                  >
                    {hubName}
                  </span>

                  {/* Km indicator */}
                  <span style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                    {stop.kmFromOrigin} km
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
