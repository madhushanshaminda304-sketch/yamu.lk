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
  Lightning,
  SuitcaseSimple,
} from '@phosphor-icons/react';
import type { MatchedRideResult } from '../domain/matching.ts';
import { getHubById } from '../domain/corridors.ts';
import { formatLkr, formatColomboTime, t, type LocaleCode } from '../domain/i18n.ts';

export function getDriverInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function RideCardItem({
  result,
  locale,
}: {
  result: MatchedRideResult;
  locale?: LocaleCode;
}) {
  const { ride, fromStop, toStop, legPriceLkr, legDurationMinutes, availableSeatsOnLeg, smartTags } = result;
  const navigate = useNavigate();
  const currentLocale = locale ?? 'en-LK';
  const langKey = currentLocale.slice(0, 2) as 'en' | 'si' | 'ta';

  const fromHub = getHubById(fromStop.hubId);
  const toHub = getHubById(toStop.hubId);
  const fromCity = fromHub?.name[langKey] || fromHub?.name.en || fromStop.hubId;
  const toCity = toHub?.name[langKey] || toHub?.name.en || toStop.hubId;

  return (
    <article
      className="ride-card"
      onClick={() => navigate(`/rides/${ride.id}?from=${fromStop.hubId}&to=${toStop.hubId}`)}
      tabIndex={0}
      role="button"
      aria-label={`Ride from ${fromCity} to ${toCity} with ${ride.driver.name}`}
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
              {tag === 'cheapest_and_earliest' && (
                <>
                  <Star size={12} weight="fill" />
                  <Clock size={12} weight="bold" />
                  <span>{t(currentLocale, 'tag.cheapest_and_earliest')}</span>
                </>
              )}
              {tag === 'cheapest' && (
                <>
                  <Star size={12} weight="fill" />
                  <span>{t(currentLocale, 'tag.cheapest')}</span>
                </>
              )}
              {tag === 'earliest' && (
                <>
                  <Clock size={12} weight="bold" />
                  <span>{t(currentLocale, 'tag.earliest')}</span>
                </>
              )}
              {tag === 'fastest' && (
                <>
                  <Lightning size={12} weight="fill" />
                  <span>{t(currentLocale, 'tag.fastest')}</span>
                </>
              )}
              {tag === 'boost' && (
                <>
                  <Sparkle size={12} weight="fill" />
                  <span>{t(currentLocale, 'tag.boost')}</span>
                </>
              )}
            </span>
          ))}
          {ride.hasTolls && (
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--yamo-emerald, #047857)', background: '#ecfdf5', padding: '3px 8px', borderRadius: '9999px', border: '1px solid #d1fae5', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Lightning size={12} weight="fill" />
              <span>Expressway</span>
            </span>
          )}
        </div>
        <div className="ride-card-price">
          {formatLkr(legPriceLkr)}
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--bbc-text-muted)', display: 'block', textAlign: 'right' }}>
            per seat
          </span>
        </div>
      </div>

      <div className="ride-card-body">
        <div className="itinerary-track">
          <div className="itinerary-point">
            <span className="itinerary-time">{formatColomboTime(fromStop.departureAt)}</span>
            <div className="itinerary-node departure" aria-hidden="true" />
            <div className="itinerary-detail">
              <span className="itinerary-city">{fromCity}</span>
              {fromStop.pickupLandmark && <span className="itinerary-landmark">{fromStop.pickupLandmark}</span>}
            </div>
          </div>

          <div className="itinerary-connector" aria-hidden="true">
            <div className="itinerary-line" />
            <div className="itinerary-duration">
              <Clock size={12} weight="bold" />
              <span>~{Math.round(legDurationMinutes / 60)}h {legDurationMinutes % 60}m</span>
            </div>
          </div>

          <div className="itinerary-point">
            <span className="itinerary-time">{formatColomboTime(toStop.arrivalAt)}</span>
            <div className="itinerary-node arrival" aria-hidden="true" />
            <div className="itinerary-detail">
              <span className="itinerary-city">{toCity}</span>
              {toStop.pickupLandmark && <span className="itinerary-landmark">{toStop.pickupLandmark}</span>}
            </div>
          </div>
        </div>

        <div className="ride-card-seats-badge">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 700, color: availableSeatsOnLeg <= 1 ? 'var(--bbc-red, #dc2626)' : 'var(--bbc-navy)' }}>
            <Users size={15} />
            <span>{availableSeatsOnLeg} {availableSeatsOnLeg === 1 ? 'seat left' : 'seats left'}</span>
          </div>
          {ride.approvalMode === 'instant' ? (
            <div style={{ fontSize: '12px', color: 'var(--yamo-emerald, #047857)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Sparkle size={13} weight="fill" />
              <span>{t(currentLocale, 'booking.instant')}</span>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--bbc-text-secondary)' }}>
              {t(currentLocale, 'booking.manual')}
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
                  {t(currentLocale, 'trust.super_driver')}
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
            const label = lug === 'small' ? 'Small bag' : lug === 'large' ? 'Airport bag' : 'Luggage ok';
            return (
              <span title={`Luggage: ${lug}`} style={{ fontSize: '11px', fontWeight: 700, background: '#f1f5f9', color: '#334155', padding: '2px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <SuitcaseSimple size={13} weight="bold" />
                <span>{label}</span>
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
