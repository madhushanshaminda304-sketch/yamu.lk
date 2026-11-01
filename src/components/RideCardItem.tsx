import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Users,
  Sparkle,
  Star,
  Wind,
  GenderFemale,
  MusicNotes,
  PawPrint,
} from '@phosphor-icons/react';
import type { MatchedRideResult } from '../domain/matching.ts';
import { getHubById } from '../domain/corridors.ts';
import { formatLkr, formatColomboTime } from '../domain/i18n.ts';

export function getDriverInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function RideCardItem({ result }: { result: MatchedRideResult }) {
  const { ride, fromStop, toStop, legPriceLkr, legDurationMinutes, availableSeatsOnLeg, smartTags } = result;
  const navigate = useNavigate();

  return (
    <article
      className="ride-card"
      onClick={() => navigate(`/rides/${ride.id}?from=${fromStop.hubId}&to=${toStop.hubId}`)}
      tabIndex={0}
      role="button"
      aria-label={`Ride from ${getHubById(fromStop.hubId)?.name.en} to ${getHubById(toStop.hubId)?.name.en} with ${ride.driver.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          navigate(`/rides/${ride.id}?from=${fromStop.hubId}&to=${toStop.hubId}`);
        }
      }}
    >
      <div className="ride-card-header">
        <div className="smart-tags-row">
          {smartTags.map((tag) => (
            <span key={tag} className={`smart-tag ${tag}`}>
              {tag === 'cheapest_and_earliest' && '★ ⏰ Cheapest & Earliest'}
              {tag === 'cheapest' && '★ Cheapest'}
              {tag === 'earliest' && '⏰ Earliest'}
              {tag === 'fastest' && '⚡ Fastest'}
              {tag === 'boost' && '✨ Boost Stopover'}
            </span>
          ))}
          {ride.hasTolls && (
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#00875a', background: '#e3fcef', padding: '3px 8px', borderRadius: '9999px' }}>
              Expressway (Tolls Included)
            </span>
          )}
        </div>
        <div className="ride-card-price">
          {formatLkr(legPriceLkr)}
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--bbc-text-secondary)', display: 'block', textAlign: 'right' }}>
            per seat
          </span>
        </div>
      </div>

      <div className="ride-card-body">
        <div className="itinerary-track">
          <div className="itinerary-point">
            <span className="itinerary-time">{formatColomboTime(fromStop.departureAt)}</span>
            <div className="itinerary-detail">
              <span className="itinerary-city">{getHubById(fromStop.hubId)?.name.en}</span>
              <span className="itinerary-landmark">{fromStop.pickupLandmark}</span>
            </div>
          </div>

          <div style={{ paddingLeft: '72px', fontSize: '13px', color: 'var(--bbc-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={15} />
            <span>~{Math.round(legDurationMinutes / 60)}h {legDurationMinutes % 60}m</span>
          </div>

          <div className="itinerary-point">
            <span className="itinerary-time">{formatColomboTime(toStop.arrivalAt)}</span>
            <div className="itinerary-detail">
              <span className="itinerary-city">{getHubById(toStop.hubId)?.name.en}</span>
              <span className="itinerary-landmark">{toStop.pickupLandmark}</span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right', minWidth: '120px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 700, color: availableSeatsOnLeg <= 1 ? '#bf2600' : 'var(--bbc-navy)' }}>
            <Users size={16} />
            <span>{availableSeatsOnLeg} {availableSeatsOnLeg === 1 ? 'seat left' : 'seats left'}</span>
          </div>
          {ride.approvalMode === 'instant' ? (
            <div style={{ fontSize: '12px', color: 'var(--bbc-blue)', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
              <Sparkle size={14} weight="fill" />
              <span>Instant Booking</span>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--bbc-text-secondary)', marginTop: '4px' }}>
              Request to Book
            </div>
          )}
        </div>
      </div>

      <div className="ride-card-footer">
        <div className="driver-info">
          <div className="driver-avatar">
            {getDriverInitials(ride.driver.name)}
          </div>
          <div className="driver-name-block">
            <div className="driver-name">
              <span>{ride.driver.name}</span>
              {ride.driver.isSuperDriver && (
                <span className="super-driver-badge">
                  <Star size={11} weight="fill" />
                  Super Driver
                </span>
              )}
            </div>
            <div className="driver-rating">
              <Star size={14} color="#f57f17" weight="fill" />
              <strong>{ride.driver.rating.toFixed(1)}</strong>
              <span>({ride.driver.ratingsCount} ratings)</span>
            </div>
          </div>
        </div>

        <div className="comfort-icons">
          {ride.vehicle.acGuaranteed && <span title="AC Guaranteed"><Wind size={18} /></span>}
          {ride.comfort.maxTwoInBack && <span title="Max 2 in the back" style={{ fontSize: '12px', fontWeight: 800, background: 'var(--bbc-surface)', padding: '2px 6px', borderRadius: '4px' }}>2 in back</span>}
          {(() => {
            const lug = ride.luggageCapacity ?? ride.comfort?.luggage ?? 'medium';
            const badgeText = lug === 'small' ? '🎒 Small bag' : lug === 'large' ? '✈️ Airport bag' : '🧳 Luggage ok';
            return (
              <span title={`Luggage: ${lug}`} style={{ fontSize: '11px', fontWeight: 700, background: '#f1f5f9', color: '#334155', padding: '2px 6px', borderRadius: '4px' }}>
                {badgeText}
              </span>
            );
          })()}
          {ride.comfort.womenOnly && <span title="Women Only" style={{ color: '#d81b60' }}><GenderFemale size={18} weight="bold" /></span>}
          {ride.comfort.music === 'yes' && <span title="Music Allowed"><MusicNotes size={18} /></span>}
          {ride.comfort.pets === 'yes' && <span title="Pets Allowed"><PawPrint size={18} /></span>}
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--bbc-navy)' }}>{ride.vehicle.makeModel}</span>
        </div>
      </div>
    </article>
  );
}
