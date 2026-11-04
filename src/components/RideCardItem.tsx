import { useUiText } from './useUiText.ts';
import React from 'react';
import { useNavigate } from '../components/LocalizedRouter.tsx';
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
import { getHubById, getHubDisplayName } from '../domain/corridors.ts';
import { formatLkr, formatColomboTime, t, type LocaleCode } from '../domain/i18n.ts';
import { CarPlateBadge } from './CarPlateBadge.tsx';
import { generateCostSplitBadge, lookupRdaExpresswayToll } from '../utils/sriLankaTollAndFuel.ts';

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
  const { tr, uiLocale } = useUiText(locale);
  const { ride, fromStop, toStop, legPriceLkr, legDistanceKm, legDurationMinutes, availableSeatsOnLeg, smartTags } = result;
  const navigate = useNavigate();
  const currentLocale = locale ?? uiLocale;
  const langKey = currentLocale.slice(0, 2) as 'en' | 'si' | 'ta';

  const fromHub = getHubById(fromStop.hubId);
  const toHub = getHubById(toStop.hubId);
  const fromCity = getHubDisplayName(fromHub, currentLocale) || fromStop.hubId;
  const toCity = getHubDisplayName(toHub, currentLocale) || toStop.hubId;

  const tollLkr = ride.estimatedTollLkr > 0 ? ride.estimatedTollLkr : lookupRdaExpresswayToll(fromStop.hubId, toStop.hubId);
  const distKm = legDistanceKm && legDistanceKm > 0 ? legDistanceKm : Math.max(20, Math.round(legDurationMinutes * 0.95));
  const routeCode = ride.hasTolls
    ? (fromStop.hubId.includes('kandy') || toStop.hubId.includes('kandy')
        ? 'E04'
        : fromStop.hubId.includes('katunayake') || toStop.hubId.includes('katunayake')
        ? 'E03'
        : 'E01')
    : 'Direct';
  const costSplitBadge = generateCostSplitBadge(distKm, tollLkr, routeCode);

  return (
    <article
      className="ride-card"
      onClick={() => navigate(`/rides/${ride.id}?from=${fromStop.hubId}&to=${toStop.hubId}`)}
      tabIndex={0}
      role="button"
      aria-label={tr("Ride from {0} to {1} with {2}", { "0": fromCity, "1": toCity, "2": ride.driver.name })}
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
          {ride.journeyStatus === 'departed' && (
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#047857', background: '#d1fae5', padding: '3px 8px', borderRadius: '9999px', border: '1px solid #a7f3d0', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span>{tr("🟢 En Route")}</span>
            </span>
          )}
          {(ride.vehicleCategory || ride.vehicle.category) !== 'car' && (
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7', background: '#e0f2fe', padding: '3px 8px', borderRadius: '9999px', border: '1px solid #bae6fd', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span>{(ride.vehicleCategory || ride.vehicle.category) === 'suv' ? tr("🚙 Comfort SUV") : tr("🚐 Spacious Van")}</span>
            </span>
          )}
          {ride.comfort?.quietRide && (
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', background: '#f1f5f9', padding: '3px 8px', borderRadius: '9999px', border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span>{tr("🔇 Quiet Ride")}</span>
            </span>
          )}
          {ride.hasTolls && (
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--yamo-emerald, #047857)', background: '#ecfdf5', padding: '3px 8px', borderRadius: '9999px', border: '1px solid #d1fae5', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Lightning size={12} weight="fill" />
              <span>{tr("Expressway")}</span>
            </span>
          )}
          {ride.specialRequirements?.childSeatAvailable && (
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '3px 8px', borderRadius: '9999px', border: '1px solid #fde68a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span>{tr("💺 Child Seat")}</span>
            </span>
          )}
          {ride.specialRequirements?.wheelchairAccessible && (
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#1d4ed8', background: '#dbeafe', padding: '3px 8px', borderRadius: '9999px', border: '1px solid #bfdbfe', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span>{tr("♿ Accessible")}</span>
            </span>
          )}
          {ride.specialRequirements?.airportFlightTransfer && (
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#047857', background: '#ecfdf5', padding: '3px 8px', borderRadius: '9999px', border: '1px solid #a7f3d0', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span>{tr("✈️ Airport Transit")}</span>
            </span>
          )}
        </div>
        <div className="ride-card-price">
          {formatLkr(legPriceLkr, uiLocale)}
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--bbc-text-muted)', display: 'block', textAlign: 'right' }}>{tr("per seat")}</span>
        </div>
      </div>

      <div
        className="ride-card-cost-split-pill"
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: '#047857',
          background: '#ecfdf5',
          padding: '4px 10px',
          borderRadius: '6px',
          border: '1px solid #a7f3d0',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          width: 'fit-content',
          marginTop: '-6px',
        }}
      >
        <span>⛽</span>
        <span>{tr(costSplitBadge.tollPart)} · {tr(costSplitBadge.savingsPart)}</span>
      </div>

      <div className="ride-card-body">
        <div className="itinerary-track">
          <div className="itinerary-point">
            <span className="itinerary-time">{formatColomboTime(fromStop.departureAt, uiLocale)}</span>
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
            <span className="itinerary-time">{formatColomboTime(toStop.arrivalAt, uiLocale)}</span>
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
            <span>{availableSeatsOnLeg} {availableSeatsOnLeg === 1 ? tr("seat left") : tr("seats left")}</span>
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
              <span>({ride.driver.ratingsCount} {tr("ratings)")}</span>
            </div>
          </div>
        </div>

        <div className="comfort-icons">
          {ride.vehicle.acGuaranteed && <span title={tr("AC Guaranteed")}><Wind size={18} /></span>}
          {ride.comfort.maxTwoInBack && <span title={tr("Max 2 in the back")} style={{ fontSize: '12px', fontWeight: 800, background: 'var(--bbc-surface)', padding: '2px 6px', borderRadius: '4px' }}>{tr("2 in back")}</span>}
          {(() => {
            const lug = ride.luggageCapacity ?? ride.comfort?.luggage ?? 'medium';
            const label = lug === 'small' ? tr("Small bag") : lug === 'large' ? tr("Airport bag") : tr("Luggage ok");
            return (
              <span title={tr("Luggage: {0}", { "0": lug })} style={{ fontSize: '11px', fontWeight: 700, background: '#f1f5f9', color: '#334155', padding: '2px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <SuitcaseSimple size={13} weight="bold" />
                <span>{label}</span>
              </span>
            );
          })()}
          {ride.comfort.womenOnly && <span title={tr("Women Only")} style={{ color: '#d81b60' }}><GenderFemale size={18} weight="bold" /></span>}
          {ride.comfort.music === 'yes' && <span title={tr("Music Allowed")}><MusicNotes size={18} /></span>}
          {ride.comfort.pets === 'yes' && <span title={tr("Pets Allowed")}><PawPrint size={18} /></span>}
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--bbc-navy)' }}>{ride.vehicle.makeModel}</span>
          <CarPlateBadge
            plate={ride.vehicle.plateHint || ride.vehicle.plateNumber || 'WP CAB-••••'}
            isMasked
            size="sm"
          />
        </div>
      </div>
    </article>
  );
}
