import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  Sparkle,
  Star,
  UserCheck,
  GenderFemale,
  Wind,
  PawPrint,
  X,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { getHubById } from '../domain/corridors.ts';
import { searchRides, type MatchedRideResult } from '../domain/matching.ts';
import { t, formatLkr, formatColomboDate, getColomboDateOffset } from '../domain/i18n.ts';
import type { MarketplaceStore, MarketplaceState } from '../state/store.ts';
import { RideCardItem } from '../components/RideCardItem.tsx';

export function SearchView({
  state,
  store,
}: {
  state: MarketplaceState;
  store: MarketplaceStore;
}) {
  const [params] = useSearchParams();
  const locale = state.locale;

  const fromHubId = params.get('from') || 'colombo';
  const toHubId = params.get('to') || 'galle';
  const date = params.get('date') || getColomboDateOffset(1);
  const seats = Number(params.get('seats') || '1');

  // Filter States
  const [sortBy, setSortBy] = useState<'departure' | 'price' | 'duration'>('departure');
  const [timeWindow, setTimeWindow] = useState<'all' | 'before_6' | 'morning_6_12' | 'afternoon_12_18' | 'evening_after_18'>('all');
  const [maxPrice, setMaxPrice] = useState(10000);
  const [instantOnly, setInstantOnly] = useState(false);
  const [superDriverOnly, setSuperDriverOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [maxTwoInBackOnly, setMaxTwoInBackOnly] = useState(false);
  const [womenOnly, setWomenOnly] = useState(false);
  const [acOnly, setAcOnly] = useState(false);
  const [petsAllowedOnly, setPetsAllowedOnly] = useState(false);

  // Ride Alert Modal
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertEmail, setAlertEmail] = useState(state.currentUser?.email || '');

  const fromHub = getHubById(fromHubId);
  const toHub = getHubById(toHubId);

  const results: MatchedRideResult[] = searchRides(state.rides, {
    fromHubId,
    toHubId,
    date,
    seats,
    sortBy,
    timeWindow,
    maxPriceLkr: maxPrice,
    instantOnly,
    superDriverOnly,
    verifiedOnly,
    maxTwoInBackOnly,
    womenOnly,
    acOnly,
    petsAllowedOnly,
  });

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertEmail.trim()) {
      toast.error('Please enter a valid email address.');
      return;
    }
    store.createRideAlert({
      fromHubId,
      toHubId,
      date,
      email: alertEmail.trim(),
    });
    toast.success(`Ride alert activated for ${fromHub?.name.en} → ${toHub?.name.en}. You will receive an email as soon as a driver offers a seat!`);
    setShowAlertModal(false);
  };

  return (
    <div className="shell">
      <div style={{ padding: '24px 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--bbc-border)' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--bbc-navy)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{fromHub?.name.en || fromHubId}</span>
            <ArrowRight size={22} />
            <span>{toHub?.name.en || toHubId}</span>
          </h1>
          <p style={{ color: 'var(--bbc-text-secondary)', fontSize: '15px' }}>
            {formatColomboDate(`${date}T12:00:00+05:30`)} · {seats} {seats === 1 ? 'Passenger' : 'Passengers'} · {results.length} rides available
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={() => setShowAlertModal(true)}
          aria-label="Create a Ride Alert"
        >
          <Bell size={18} />
          <span>{t(locale, 'alert.cta')}</span>
        </button>
      </div>

      <div className="search-layout">
        {/* Sidebar Filters */}
        <aside className="filters-sidebar">
          <div className="filter-block">
            <h3>{t(locale, 'filter.title')}</h3>
            <div className="filter-options">
              <label>
                <input
                  type="radio"
                  name="sortBy"
                  checked={sortBy === 'departure'}
                  onChange={() => setSortBy('departure')}
                />
                Earliest departure
              </label>
              <label>
                <input
                  type="radio"
                  name="sortBy"
                  checked={sortBy === 'price'}
                  onChange={() => setSortBy('price')}
                />
                Lowest price
              </label>
              <label>
                <input
                  type="radio"
                  name="sortBy"
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
                  name="timeWindow"
                  checked={timeWindow === 'all'}
                  onChange={() => setTimeWindow('all')}
                />
                Any time
              </label>
              <label>
                <input
                  type="radio"
                  name="timeWindow"
                  checked={timeWindow === 'before_6'}
                  onChange={() => setTimeWindow('before_6')}
                />
                Early (Before 06:00)
              </label>
              <label>
                <input
                  type="radio"
                  name="timeWindow"
                  checked={timeWindow === 'morning_6_12'}
                  onChange={() => setTimeWindow('morning_6_12')}
                />
                Morning (06:00 – 12:00)
              </label>
              <label>
                <input
                  type="radio"
                  name="timeWindow"
                  checked={timeWindow === 'afternoon_12_18'}
                  onChange={() => setTimeWindow('afternoon_12_18')}
                />
                Afternoon (12:00 – 18:00)
              </label>
              <label>
                <input
                  type="radio"
                  name="timeWindow"
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
              style={{ width: '100%', accentColor: 'var(--bbc-blue)' }}
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
                <Sparkle size={16} color="var(--bbc-blue)" weight="fill" />
                {t(locale, 'filter.instant')}
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={superDriverOnly}
                  onChange={(e) => setSuperDriverOnly(e.target.checked)}
                />
                <Star size={16} color="#f57f17" weight="fill" />
                {t(locale, 'filter.super_driver')}
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                />
                <UserCheck size={16} color="var(--bbc-blue)" weight="bold" />
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
            </div>
          </div>
        </aside>

        {/* Results List */}
        <main className="results-container">
          {results.length === 0 ? (
            <div className="empty-results">
              <h2>No rides found for this date & filters</h2>
              <p>
                Drivers often post their journeys 2-3 days before departure. Set a Ride Alert to receive an email as soon as a driver publishes!
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowAlertModal(true)}
                style={{ marginTop: '20px' }}
                aria-label="Create a Ride Alert"
              >
                <Bell size={18} />
                <span>Create a Ride Alert</span>
              </button>
            </div>
          ) : (
            <div className="rides-list">
              {results.map((item) => (
                <RideCardItem
                  key={`${item.ride.id}-${item.fromStop.hubId}-${item.toStop.hubId}`}
                  result={item}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Ride Alert Modal */}
      {showAlertModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 71, 82, 0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', padding: '28px', maxWidth: '440px', width: '100%', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--bbc-navy)' }}>
                Create a Ride Alert
              </h3>
              <button type="button" onClick={() => setShowAlertModal(false)} aria-label="Close dialog"><X size={20} /></button>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--bbc-text-secondary)', marginBottom: '20px' }}>
              We will notify you immediately when a verified driver publishes a seat from <strong>{fromHub?.name.en}</strong> to <strong>{toHub?.name.en}</strong> on {formatColomboDate(`${date}T00:00:00+05:30`)}.
            </p>

            <form onSubmit={handleCreateAlert} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label htmlFor="alert-email-input" style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Your Email</label>
                <input
                  id="alert-email-input"
                  type="email"
                  required
                  placeholder="name@domain.lk"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="btn-secondary btn-sm" onClick={() => setShowAlertModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary btn-sm">
                  Create Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
