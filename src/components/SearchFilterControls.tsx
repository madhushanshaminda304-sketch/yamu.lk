import React from 'react';
import {
  Sparkle,
  Star,
  UserCheck,
  Wind,
  PawPrint,
  GenderFemale,
  Users,
} from '@phosphor-icons/react';
import { t, formatLkr, type LocaleCode } from '../domain/i18n.ts';
import type { VehicleCategory } from '../domain/matching.ts';

export interface SearchFilterControlsProps {
  sortBy: 'departure' | 'price' | 'duration';
  setSortBy: (val: 'departure' | 'price' | 'duration') => void;
  timeWindow: 'all' | 'before_6' | 'morning_6_12' | 'afternoon_12_18' | 'evening_after_18';
  setTimeWindow: (val: 'all' | 'before_6' | 'morning_6_12' | 'afternoon_12_18' | 'evening_after_18') => void;
  maxPrice: number;
  setMaxPrice: (val: number) => void;
  instantOnly: boolean;
  setInstantOnly: (val: boolean) => void;
  superDriverOnly: boolean;
  setSuperDriverOnly: (val: boolean) => void;
  verifiedOnly: boolean;
  setVerifiedOnly: (val: boolean) => void;
  maxTwoInBackOnly: boolean;
  setMaxTwoInBackOnly: (val: boolean) => void;
  womenOnly: boolean;
  setWomenOnly: (val: boolean) => void;
  acOnly: boolean;
  setAcOnly: (val: boolean) => void;
  petsAllowedOnly: boolean;
  setPetsAllowedOnly: (val: boolean) => void;
  vehicleCategory?: VehicleCategory | 'all';
  setVehicleCategory?: (val: VehicleCategory | 'all') => void;
  quietRideOnly?: boolean;
  setQuietRideOnly?: (val: boolean) => void;
  childSeatOnly?: boolean;
  setChildSeatOnly?: (val: boolean) => void;
  wheelchairOnly?: boolean;
  setWheelchairOnly?: (val: boolean) => void;
  airportOnly?: boolean;
  setAirportOnly?: (val: boolean) => void;
  pickupPrecision?: 'all' | 'interchange_only' | 'town_center';
  setPickupPrecision?: (val: 'all' | 'interchange_only' | 'town_center') => void;
  luggageSpace?: 'all' | 'backpack_only' | 'large_suitcase';
  setLuggageSpace?: (val: 'all' | 'backpack_only' | 'large_suitcase') => void;
  settlementPreference?: 'all' | 'lankaqr' | 'cash_lkr';
  setSettlementPreference?: (val: 'all' | 'lankaqr' | 'cash_lkr') => void;
  locale: LocaleCode;
  namePrefix?: string;
}

export function SearchFilterControls({
  sortBy,
  setSortBy,
  timeWindow,
  setTimeWindow,
  maxPrice,
  setMaxPrice,
  instantOnly,
  setInstantOnly,
  superDriverOnly,
  setSuperDriverOnly,
  verifiedOnly,
  setVerifiedOnly,
  maxTwoInBackOnly,
  setMaxTwoInBackOnly,
  womenOnly,
  setWomenOnly,
  acOnly,
  setAcOnly,
  petsAllowedOnly,
  setPetsAllowedOnly,
  vehicleCategory,
  setVehicleCategory,
  quietRideOnly,
  setQuietRideOnly,
  childSeatOnly,
  setChildSeatOnly,
  wheelchairOnly,
  setWheelchairOnly,
  airportOnly,
  setAirportOnly,
  pickupPrecision,
  setPickupPrecision,
  luggageSpace,
  setLuggageSpace,
  settlementPreference,
  setSettlementPreference,
  locale,
  namePrefix = 'filter',
}: SearchFilterControlsProps) {
  return (
    <>
      <div className="filter-block">
        <h3>{t(locale, 'filter.title')}</h3>
        <div className="filter-options">
          <label>
            <input
              type="radio"
              name={`${namePrefix}SortBy`}
              checked={sortBy === 'departure'}
              onChange={() => setSortBy('departure')}
            />
            Earliest departure
          </label>
          <label>
            <input
              type="radio"
              name={`${namePrefix}SortBy`}
              checked={sortBy === 'price'}
              onChange={() => setSortBy('price')}
            />
            Lowest price
          </label>
          <label>
            <input
              type="radio"
              name={`${namePrefix}SortBy`}
              checked={sortBy === 'duration'}
              onChange={() => setSortBy('duration')}
            />
            Shortest ride
          </label>
        </div>
      </div>

      <div className="filter-block">
        <h3>Departure time</h3>
        <div className="filter-options">
          <label>
            <input
              type="radio"
              name={`${namePrefix}TimeWindow`}
              checked={timeWindow === 'all'}
              onChange={() => setTimeWindow('all')}
            />
            Any time
          </label>
          <label>
            <input
              type="radio"
              name={`${namePrefix}TimeWindow`}
              checked={timeWindow === 'before_6'}
              onChange={() => setTimeWindow('before_6')}
            />
            Early (Before 06:00)
          </label>
          <label>
            <input
              type="radio"
              name={`${namePrefix}TimeWindow`}
              checked={timeWindow === 'morning_6_12'}
              onChange={() => setTimeWindow('morning_6_12')}
            />
            Morning (06:00 – 12:00)
          </label>
          <label>
            <input
              type="radio"
              name={`${namePrefix}TimeWindow`}
              checked={timeWindow === 'afternoon_12_18'}
              onChange={() => setTimeWindow('afternoon_12_18')}
            />
            Afternoon (12:00 – 18:00)
          </label>
          <label>
            <input
              type="radio"
              name={`${namePrefix}TimeWindow`}
              checked={timeWindow === 'evening_after_18'}
              onChange={() => setTimeWindow('evening_after_18')}
            />
            Evening (After 18:00)
          </label>
        </div>
      </div>

      <div className="filter-block">
        <h3>Max Price: {formatLkr(maxPrice)}</h3>
        <input
          type="range"
          min={500}
          max={10000}
          step={250}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--yamo-emerald, #047857)' }}
          aria-label="Maximum contribution price"
        />
      </div>

      <div className="filter-block">
        <h3>Trust & Booking Mode</h3>
        <div className="filter-options">
          <label>
            <input
              type="checkbox"
              checked={instantOnly}
              onChange={(e) => setInstantOnly(e.target.checked)}
            />
            <Sparkle size={16} color="var(--yamo-emerald, #047857)" weight="fill" />
            {t(locale, 'filter.instant')}
          </label>
          <label>
            <input
              type="checkbox"
              checked={superDriverOnly}
              onChange={(e) => setSuperDriverOnly(e.target.checked)}
            />
            <Star size={16} color="var(--yamo-gold, #f59e0b)" weight="fill" />
            {t(locale, 'filter.super_driver')}
          </label>
          <label>
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
            />
            <UserCheck size={16} color="var(--yamo-emerald, #047857)" weight="bold" />
            {t(locale, 'filter.verified')}
          </label>
        </div>
      </div>

      <div className="filter-block">
        <h3>Vehicle & Comfort</h3>
        <div className="filter-options">
          <label>
            <input
              type="checkbox"
              checked={acOnly}
              onChange={(e) => setAcOnly(e.target.checked)}
            />
            <Wind size={16} />
            {t(locale, 'filter.ac')}
          </label>
          <label>
            <input
              type="checkbox"
              checked={maxTwoInBackOnly}
              onChange={(e) => setMaxTwoInBackOnly(e.target.checked)}
            />
            <Users size={16} />
            {t(locale, 'filter.max_two_back')}
          </label>
          <label>
            <input
              type="checkbox"
              checked={womenOnly}
              onChange={(e) => setWomenOnly(e.target.checked)}
            />
            <GenderFemale size={16} color="#d81b60" weight="bold" />
            {t(locale, 'filter.women_only')}
          </label>
          <label>
            <input
              type="checkbox"
              checked={petsAllowedOnly}
              onChange={(e) => setPetsAllowedOnly(e.target.checked)}
            />
            <PawPrint size={16} />
            {t(locale, 'filter.pets')}
          </label>
          {setQuietRideOnly && (
            <label>
              <input
                type="checkbox"
                checked={quietRideOnly || false}
                onChange={(e) => setQuietRideOnly(e.target.checked)}
              />
              <span style={{ fontSize: '15px' }}>🔇</span>
              Quiet Commute
            </label>
          )}
          {setChildSeatOnly && (
            <label>
              <input
                type="checkbox"
                checked={childSeatOnly || false}
                onChange={(e) => setChildSeatOnly(e.target.checked)}
              />
              <span style={{ fontSize: '15px' }}>💺</span>
              Child Safety Seat
            </label>
          )}
          {setWheelchairOnly && (
            <label>
              <input
                type="checkbox"
                checked={wheelchairOnly || false}
                onChange={(e) => setWheelchairOnly(e.target.checked)}
              />
              <span style={{ fontSize: '15px' }}>♿</span>
              Wheelchair / Assistance
            </label>
          )}
          {setAirportOnly && (
            <label>
              <input
                type="checkbox"
                checked={airportOnly || false}
                onChange={(e) => setAirportOnly(e.target.checked)}
              />
              <span style={{ fontSize: '15px' }}>✈️</span>
              Airport / BIA Transit
            </label>
          )}
        </div>
      </div>

      <div className="filter-block">
        <h3>{t(locale, 'filter.pickup_precision')} & {t(locale, 'filter.settlement')}</h3>
        <div className="filter-options">
          {setPickupPrecision && (
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                📍 {t(locale, 'filter.pickup_precision')}
              </span>
              <select
                value={pickupPrecision || 'all'}
                onChange={(e) => setPickupPrecision(e.target.value as 'all' | 'interchange_only' | 'town_center')}
                style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
              >
                <option value="all">Any Pickup Location</option>
                <option value="interchange_only">{t(locale, 'filter.interchange_only')}</option>
                <option value="town_center">{t(locale, 'filter.town_center')}</option>
              </select>
            </div>
          )}

          {setLuggageSpace && (
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                🧳 {t(locale, 'filter.luggage')}
              </span>
              <select
                value={luggageSpace || 'all'}
                onChange={(e) => setLuggageSpace(e.target.value as 'all' | 'backpack_only' | 'large_suitcase')}
                style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
              >
                <option value="all">Any Luggage Size</option>
                <option value="backpack_only">{t(locale, 'luggage.backpack')}</option>
                <option value="large_suitcase">{t(locale, 'filter.large_suitcase')}</option>
              </select>
            </div>
          )}

          {setSettlementPreference && (
            <div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                💳 {t(locale, 'filter.settlement')}
              </span>
              <select
                value={settlementPreference || 'all'}
                onChange={(e) => setSettlementPreference(e.target.value as 'all' | 'lankaqr' | 'cash_lkr')}
                style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
              >
                <option value="all">Any Settlement Method</option>
                <option value="lankaqr">{t(locale, 'filter.lankaqr')}</option>
                <option value="cash_lkr">{t(locale, 'settlement.cash')}</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
