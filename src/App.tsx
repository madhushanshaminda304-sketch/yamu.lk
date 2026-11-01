import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { Routes, Route, Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  MagnifyingGlass,
  PlusCircle,
  Car,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  ArrowsLeftRight,
  Clock,
  Coins,
  MapPin,
  CalendarBlank,
  Users,
  Star,
  WarningCircle,
  ChatCircleText,
  CheckCircle,
  Phone,
  WhatsappLogo,
  Sparkle,
  SuitcaseSimple,
  Wind,
  MusicNotes,
  PawPrint,
  Cigarette,
  GenderFemale,
  Check,
  X,
  Bell,
  ArrowSquareOut
} from '@phosphor-icons/react';

import { HUBS, getHubById, findRouteOptions } from './domain/corridors.ts';
import {
  calculateRecommendedLkr,
  getContributionBounds,
  getPriceBand,
  stepContributionLkr,
} from './domain/pricing.ts';
import {
  searchRides,
  canBookLeg,
  type Ride,
  type MatchedRideResult,
  type ApprovalMode,
  type VehicleCategory,
} from './domain/matching.ts';
import {
  t,
  formatLkr,
  formatColomboDate,
  formatColomboTime,
  getColomboDateOffset,
  type LocaleCode,
} from './domain/i18n.ts';
import {
  createMarketplaceStore,
  type SettlementMethod,
  type BookingRecord,
} from './state/store.ts';

// Singleton persistent store
const store = createMarketplaceStore();

export default function App() {
  const state = useSyncExternalStore(store.subscribe, store.getState);
  const locale = state.locale;

  return (
    <div className="app-root">
      <header className="site-header">
        <div className="shell header-inner">
          <Link to="/" className="brand" aria-label="BlaBlaLanka Home">
            BlaBla<span className="brand-dot">Lanka</span>
            <span className="brand-badge">Sri Lanka</span>
          </Link>

          <nav className="nav-links">
            <Link to="/search" className="nav-item">
              <MagnifyingGlass size={18} weight="bold" />
              <span>{t(locale, 'nav.search')}</span>
            </Link>
            <Link to="/publish" className="nav-item">
              <PlusCircle size={18} weight="bold" />
              <span>{t(locale, 'nav.publish')}</span>
            </Link>
            <Link to="/rides" className="nav-item">
              <Car size={18} weight="bold" />
              <span>{t(locale, 'nav.rides')}</span>
              {state.bookings.length > 0 && (
                <span className="badge-pill">{state.bookings.length}</span>
              )}
            </Link>
            <Link to="/profile" className="nav-item">
              <UserCheck size={18} weight="bold" />
              <span>{t(locale, 'nav.profile')}</span>
            </Link>

            <div className="lang-switch" role="group" aria-label="Language Switcher">
              <button
                type="button"
                className={`lang-btn ${locale === 'en-LK' ? 'active' : ''}`}
                onClick={() => store.setLocale('en-LK')}
              >
                EN
              </button>
              <button
                type="button"
                className={`lang-btn ${locale === 'si-LK' ? 'active' : ''}`}
                onClick={() => store.setLocale('si-LK')}
              >
                සිං
              </button>
              <button
                type="button"
                className={`lang-btn ${locale === 'ta-LK' ? 'active' : ''}`}
                onClick={() => store.setLocale('ta-LK')}
              >
                தமிழ்
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<HomeView state={state} />} />
          <Route path="/search" element={<SearchView state={state} />} />
          <Route path="/rides/:id" element={<RideDetailView state={state} />} />
          <Route path="/publish" element={<PublishRideView state={state} />} />
          <Route path="/rides" element={<YourRidesView state={state} />} />
          <Route path="/profile" element={<ProfileView state={state} />} />
        </Routes>
      </main>

      <footer style={{ background: '#054752', color: '#ffffff', padding: '48px 0 32px', marginTop: '64px' }}>
        <div className="shell">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '32px', marginBottom: '40px' }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#00aff5', marginBottom: '12px' }}>
                BlaBlaLanka
              </div>
              <p style={{ color: '#b2c8cc', fontSize: '14px', lineHeight: 1.6 }}>
                Sri Lanka’s trusted intercity carpooling network. Share travel costs fairly on Southern Expressway, Central Corridor, and A9.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: '#ffffff' }}>Top Corridors</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#b2c8cc' }}>
                <li><Link to="/search?from=colombo&to=kandy">Colombo ↔ Kandy (A1 / E04)</Link></li>
                <li><Link to="/search?from=makumbura&to=galle">Makumbura ↔ Galle (E01)</Link></li>
                <li><Link to="/search?from=colombo&to=matara">Colombo ↔ Matara (E01)</Link></li>
                <li><Link to="/search?from=colombo&to=jaffna">Colombo ↔ Jaffna (A9)</Link></li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: '#ffffff' }}>Trust & Safety</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#b2c8cc' }}>
                <li>✓ Sri Lankan NIC & Driving Licence Verification</li>
                <li>✓ Super Driver Criteria & Rating System</li>
                <li>✓ Onboard Cash / LankaQR (Zero online payment)</li>
                <li>✓ Anti-Scam Phishing Protection</li>
              </ul>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', fontSize: '13px', color: '#8fa5a9', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <span>© {new Date().getFullYear()} BlaBlaLanka Carpooling. All rights reserved.</span>
            <span>Made for Sri Lanka · LKR Cost-Sharing Marketplace</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// -------------------------------------------------------------
// 1. HOME VIEW
// -------------------------------------------------------------
function HomeView({ state }: { state: ReturnType<typeof store.getState> }) {
  const navigate = useNavigate();
  const locale = state.locale;
  const tomorrow = getColomboDateOffset(1);

  const [fromHubId, setFromHubId] = useState('colombo');
  const [toHubId, setToHubId] = useState('galle');
  const [date, setDate] = useState(tomorrow);
  const [seats, setSeats] = useState(1);

  const handleSwap = () => {
    setFromHubId(toHubId);
    setToHubId(fromHubId);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?from=${fromHubId}&to=${toHubId}&date=${date}&seats=${seats}`);
  };

  return (
    <div>
      <section className="hero-section">
        <div className="shell hero-content">
          <h1 className="hero-title">{t(locale, 'hero.title')}</h1>
          <p className="hero-subtitle">{t(locale, 'hero.subtitle')}</p>
        </div>

        <div className="shell">
          <div className="search-card">
            <form onSubmit={handleSearch} className="search-form-grid">
              <div className="search-field">
                <label>{t(locale, 'search.from')}</label>
                <select value={fromHubId} onChange={(e) => setFromHubId(e.target.value)}>
                  {HUBS.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name[locale.slice(0, 2) as 'en' | 'si' | 'ta'] || h.name.en} {h.isExpresswayInterchange ? '⚡ (MMC/Exit)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <button type="button" className="swap-btn" onClick={handleSwap} aria-label="Swap Route">
                <ArrowsLeftRight size={18} weight="bold" />
              </button>

              <div className="search-field">
                <label>{t(locale, 'search.to')}</label>
                <select value={toHubId} onChange={(e) => setToHubId(e.target.value)}>
                  {HUBS.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name[locale.slice(0, 2) as 'en' | 'si' | 'ta'] || h.name.en} {h.isExpresswayInterchange ? '⚡ (MMC/Exit)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="search-field">
                <label>{t(locale, 'search.when')}</label>
                <input
                  type="date"
                  min={getColomboDateOffset(0)}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="search-field">
                <label>{t(locale, 'search.seats')}</label>
                <select value={seats} onChange={(e) => setSeats(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'Passenger' : 'Passengers'}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn-primary" style={{ padding: '16px 28px' }}>
                <MagnifyingGlass size={20} weight="bold" />
                <span>{t(locale, 'search.cta')}</span>
              </button>
            </form>
          </div>

          <div className="scam-banner">
            <ShieldCheck size={26} color="#d84315" weight="fill" />
            <span>
              <strong>Sri Lanka Anti-Scam Protection:</strong> {t(locale, 'scam.banner')}
            </span>
          </div>
        </div>
      </section>

      {/* USP Section */}
      <section className="shell">
        <div className="usp-grid">
          <div className="usp-card">
            <div className="usp-icon">
              <Coins size={28} weight="duotone" />
            </div>
            <h3>{t(locale, 'usp.1.title')}</h3>
            <p>{t(locale, 'usp.1.body')}</p>
          </div>
          <div className="usp-card">
            <div className="usp-icon">
              <ShieldCheck size={28} weight="duotone" />
            </div>
            <h3>{t(locale, 'usp.2.title')}</h3>
            <p>{t(locale, 'usp.2.body')}</p>
          </div>
          <div className="usp-card">
            <div className="usp-icon">
              <Sparkle size={28} weight="duotone" />
            </div>
            <h3>{t(locale, 'usp.3.title')}</h3>
            <p>{t(locale, 'usp.3.body')}</p>
          </div>
        </div>
      </section>

      {/* Popular Corridors */}
      <section className="shell corridors-section">
        <div className="section-header">
          <div>
            <h2>Popular Sri Lankan Carpool Corridors</h2>
            <p style={{ color: 'var(--bbc-text-secondary)', fontSize: '15px' }}>
              Explore frequently travelled routes with verified drivers and cost-sharing rates.
            </p>
          </div>
        </div>

        <div className="corridor-grid">
          <Link to={`/search?from=colombo&to=kandy&date=${tomorrow}`} className="corridor-card">
            <div className="corridor-route">
              <span>Colombo</span>
              <ArrowRight size={18} />
              <span>Kandy</span>
            </div>
            <div className="corridor-meta">
              <span>via A1 / Central E04</span>
              <span className="corridor-price">from LKR 1,850</span>
            </div>
          </Link>

          <Link to={`/search?from=makumbura&to=galle&date=${tomorrow}`} className="corridor-card">
            <div className="corridor-route">
              <span>Makumbura MMC</span>
              <ArrowRight size={18} />
              <span>Galle</span>
            </div>
            <div className="corridor-meta">
              <span>via E01 Expressway</span>
              <span className="corridor-price">from LKR 1,750</span>
            </div>
          </Link>

          <Link to={`/search?from=colombo&to=matara&date=${tomorrow}`} className="corridor-card">
            <div className="corridor-route">
              <span>Colombo</span>
              <ArrowRight size={18} />
              <span>Matara</span>
            </div>
            <div className="corridor-meta">
              <span>via E01 Tolls</span>
              <span className="corridor-price">from LKR 2,400</span>
            </div>
          </Link>

          <Link to={`/search?from=colombo&to=jaffna&date=${tomorrow}`} className="corridor-card">
            <div className="corridor-route">
              <span>Colombo</span>
              <ArrowRight size={18} />
              <span>Jaffna</span>
            </div>
            <div className="corridor-meta">
              <span>via Katunayake & A9</span>
              <span className="corridor-price">from LKR 7,500</span>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}

// -------------------------------------------------------------
// 2. SEARCH & DISCOVERY VIEW
// -------------------------------------------------------------
function SearchView({ state }: { state: ReturnType<typeof store.getState> }) {
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

  // Ride Alert Modal
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertEmail, setAlertEmail] = useState(state.currentUser.email || '');
  const [alertSuccess, setAlertSuccess] = useState(false);

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
  });

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertEmail.trim()) return;
    store.createRideAlert({
      fromHubId,
      toHubId,
      date,
      email: alertEmail.trim(),
    });
    setAlertSuccess(true);
    setTimeout(() => {
      setAlertSuccess(false);
      setShowAlertModal(false);
    }, 2000);
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
        >
          <Bell size={18} weight="bold" />
          <span>{t(locale, 'alert.cta')}</span>
        </button>
      </div>

      <div className="results-layout">
        {/* Filters Sidebar */}
        <aside className="filters-sidebar">
          <div className="filter-group">
            <h4>Sort by</h4>
            <label className="filter-option">
              <input type="radio" name="sort" checked={sortBy === 'departure'} onChange={() => setSortBy('departure')} />
              <span>Earliest departure</span>
            </label>
            <label className="filter-option">
              <input type="radio" name="sort" checked={sortBy === 'price'} onChange={() => setSortBy('price')} />
              <span>Lowest price</span>
            </label>
            <label className="filter-option">
              <input type="radio" name="sort" checked={sortBy === 'duration'} onChange={() => setSortBy('duration')} />
              <span>Shortest duration</span>
            </label>
          </div>

          <div className="filter-group">
            <h4>Departure Time</h4>
            <label className="filter-option">
              <input type="radio" name="time" checked={timeWindow === 'all'} onChange={() => setTimeWindow('all')} />
              <span>Any time</span>
            </label>
            <label className="filter-option">
              <input type="radio" name="time" checked={timeWindow === 'before_6'} onChange={() => setTimeWindow('before_6')} />
              <span>Early morning (Before 06:00)</span>
            </label>
            <label className="filter-option">
              <input type="radio" name="time" checked={timeWindow === 'morning_6_12'} onChange={() => setTimeWindow('morning_6_12')} />
              <span>Morning (06:00 – 12:00)</span>
            </label>
            <label className="filter-option">
              <input type="radio" name="time" checked={timeWindow === 'afternoon_12_18'} onChange={() => setTimeWindow('afternoon_12_18')} />
              <span>Afternoon (12:01 – 18:00)</span>
            </label>
            <label className="filter-option">
              <input type="radio" name="time" checked={timeWindow === 'evening_after_18'} onChange={() => setTimeWindow('evening_after_18')} />
              <span>Evening (After 18:00)</span>
            </label>
          </div>

          <div className="filter-group">
            <h4>Max Contribution</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700 }}>
              <span>LKR 500</span>
              <span style={{ color: 'var(--bbc-blue)' }}>{formatLkr(maxPrice)}</span>
            </div>
            <input
              type="range"
              min={500}
              max={10000}
              step={100}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--bbc-blue)' }}
            />
          </div>

          <div className="filter-group">
            <h4>Trust & Verification</h4>
            <label className="filter-option">
              <input type="checkbox" checked={superDriverOnly} onChange={(e) => setSuperDriverOnly(e.target.checked)} />
              <span>Super Driver Only</span>
            </label>
            <label className="filter-option">
              <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
              <span>Verified Profile (NIC + Phone)</span>
            </label>
            <label className="filter-option">
              <input type="checkbox" checked={instantOnly} onChange={(e) => setInstantOnly(e.target.checked)} />
              <span>Instant Booking</span>
            </label>
          </div>

          <div className="filter-group">
            <h4>Comfort Preferences</h4>
            <label className="filter-option">
              <input type="checkbox" checked={maxTwoInBackOnly} onChange={(e) => setMaxTwoInBackOnly(e.target.checked)} />
              <span>Max. 2 in the back</span>
            </label>
            <label className="filter-option">
              <input type="checkbox" checked={acOnly} onChange={(e) => setAcOnly(e.target.checked)} />
              <span>AC Guaranteed</span>
            </label>
            <label className="filter-option">
              <input type="checkbox" checked={womenOnly} onChange={(e) => setWomenOnly(e.target.checked)} />
              <span>Women Only (Ladies Only)</span>
            </label>
          </div>
        </aside>

        {/* Results List */}
        <div className="results-list">
          {results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 20px', background: 'var(--bbc-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
              <Clock size={48} color="var(--bbc-text-secondary)" weight="duotone" />
              <h3 style={{ fontSize: '20px', fontWeight: 800, marginTop: '16px', color: 'var(--bbc-navy)' }}>
                No rides found for this date & filters
              </h3>
              <p style={{ color: 'var(--bbc-text-secondary)', maxWidth: '440px', margin: '8px auto 24px' }}>
                Drivers often post their journeys 2–3 days before departure. Set a Ride Alert to receive an email as soon as a driver publishes!
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowAlertModal(true)}
              >
                <Bell size={20} weight="bold" />
                <span>Create a Ride Alert</span>
              </button>
            </div>
          ) : (
            results.map((res) => <RideCardItem key={`${res.ride.id}:${res.fromIndex}->${res.toIndex}`} result={res} />)
          )}
        </div>
      </div>

      {/* Ride Alert Modal */}
      {showAlertModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 71, 82, 0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', padding: '32px', maxWidth: '480px', width: '100%', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--bbc-navy)' }}>
                Create a Ride Alert
              </h3>
              <button type="button" onClick={() => setShowAlertModal(false)}><X size={20} /></button>
            </div>

            <p style={{ color: 'var(--bbc-text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              We’ll notify you immediately when a new ride or Boost stopover is published between <strong>{fromHub?.name.en}</strong> and <strong>{toHub?.name.en}</strong> on <strong>{date}</strong>.
            </p>

            {alertSuccess ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--bbc-green)', fontWeight: 700 }}>
                <CheckCircle size={24} weight="fill" />
                <span>Ride Alert created successfully!</span>
              </div>
            ) : (
              <form onSubmit={handleCreateAlert} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Your Email</label>
                  <input
                    type="email"
                    required
                    value={alertEmail}
                    onChange={(e) => setAlertEmail(e.target.value)}
                    placeholder="you@domain.lk"
                    style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--bbc-border)', borderRadius: 'var(--radius-sm)', fontSize: '15px' }}
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                  Notify Me When Rides Appear
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RideCardItem({ result }: { result: MatchedRideResult }) {
  const { ride, fromStop, toStop, legPriceLkr, legDurationMinutes, availableSeatsOnLeg, smartTags } = result;
  const navigate = useNavigate();

  return (
    <article className="ride-card" onClick={() => navigate(`/rides/${ride.id}?from=${fromStop.hubId}&to=${toStop.hubId}`)}>
      <div className="ride-card-header">
        <div className="smart-tags-row">
          {smartTags.map((tag) => (
            <span key={tag} className={`smart-tag ${tag}`}>
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
            {ride.driver.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
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
          {ride.comfort.womenOnly && <span title="Women Only" style={{ color: '#d81b60' }}><GenderFemale size={18} weight="bold" /></span>}
          {ride.comfort.music === 'yes' && <span title="Music Allowed"><MusicNotes size={18} /></span>}
          {ride.comfort.pets === 'yes' && <span title="Pets Allowed"><PawPrint size={18} /></span>}
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--bbc-navy)' }}>{ride.vehicle.makeModel}</span>
        </div>
      </div>
    </article>
  );
}

// -------------------------------------------------------------
// 3. RIDE DETAIL & BOOKING VIEW
// -------------------------------------------------------------
function RideDetailView({ state }: { state: ReturnType<typeof store.getState> }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const rideId = window.location.pathname.split('/').pop() || '';
  const ride = state.rides.find((r) => r.id === rideId);

  const fromHubId = params.get('from') || ride?.originHubId || '';
  const toHubId = params.get('to') || ride?.destinationHubId || '';

  const [seats, setSeats] = useState(1);
  const [settlementMethod, setSettlementMethod] = useState<SettlementMethod>('lankaqr');
  const [message, setMessage] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState<BookingRecord | null>(null);

  if (!ride) {
    return (
      <div className="shell" style={{ padding: '64px 0', textAlign: 'center' }}>
        <h2>Ride not found</h2>
        <Link to="/search" className="btn-primary" style={{ marginTop: '16px' }}>Back to Search</Link>
      </div>
    );
  }

  const legCheck = canBookLeg(ride, fromHubId, toHubId, seats);
  const fromStop = legCheck.fromStop || ride.stops[0];
  const toStop = legCheck.toStop || ride.stops[ride.stops.length - 1];

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');
    try {
      const record = store.bookRideLeg({
        rideId: ride.id,
        fromHubId,
        toHubId,
        seats,
        settlementMethod,
        message,
      });
      setBookingConfirmed(record);
    } catch (err: any) {
      setBookingError(err.message || 'Booking failed.');
    }
  };

  return (
    <div className="shell" style={{ padding: '32px 0 80px' }}>
      <Link to={`/search?from=${fromHubId}&to=${toHubId}&date=${ride.departureDate}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--bbc-blue)', fontWeight: 700, marginBottom: '24px' }}>
        ← Back to search results
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '36px' }}>
        {/* Left: Journey Itinerary & Driver */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div style={{ background: '#ffffff', border: '1px solid var(--bbc-border)', borderRadius: 'var(--radius-md)', padding: '28px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bbc-text-secondary)', textTransform: 'uppercase' }}>
                  {formatColomboDate(ride.departureAt)}
                </span>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--bbc-navy)', marginTop: '4px' }}>
                  {getHubById(fromHubId)?.name.en} → {getHubById(toHubId)?.name.en}
                </h1>
              </div>
              {ride.hasTolls && (
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#00875a', background: '#e3fcef', padding: '4px 12px', borderRadius: '9999px' }}>
                  {ride.corridorCode} Tolls Included
                </span>
              )}
            </div>

            {/* Stopover Itinerary Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', paddingLeft: '8px' }}>
              {ride.stops.map((stop, idx) => {
                const isSelectedFrom = stop.hubId === fromHubId;
                const isSelectedTo = stop.hubId === toHubId;
                const isBoarding = stop.stopIndex >= (legCheck.fromIndex ?? 0) && stop.stopIndex <= (legCheck.toIndex ?? ride.stops.length - 1);

                return (
                  <div key={stop.hubId} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{ width: '60px', fontSize: '16px', fontWeight: 800, color: isBoarding ? 'var(--bbc-navy)' : 'var(--bbc-text-muted)' }}>
                      {formatColomboTime(stop.departureAt)}
                    </div>
                    <div style={{ width: '16px', height: '16px', borderRadius: '9999px', background: isSelectedFrom || isSelectedTo ? 'var(--bbc-blue)' : isBoarding ? '#00875a' : '#c2cbd0', border: '3px solid #ffffff', boxShadow: 'var(--shadow-sm)', marginTop: '4px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: isBoarding ? 'var(--bbc-navy)' : 'var(--bbc-text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{getHubById(stop.hubId)?.name.en}</span>
                        {stop.isBoostStop && (
                          <span style={{ fontSize: '11px', fontWeight: 700, background: '#fff3e0', color: '#e65100', padding: '1px 6px', borderRadius: '4px' }}>
                            Boost Stopover
                          </span>
                        )}
                        {isSelectedFrom && <span style={{ fontSize: '11px', background: '#e1f5fe', color: '#0288d1', padding: '1px 6px', borderRadius: '4px' }}>Your Pickup</span>}
                        {isSelectedTo && <span style={{ fontSize: '11px', background: '#e1f5fe', color: '#0288d1', padding: '1px 6px', borderRadius: '4px' }}>Your Drop-off</span>}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--bbc-text-secondary)', marginTop: '2px' }}>
                        {stop.pickupLandmark}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Driver Card */}
          <div style={{ background: '#ffffff', border: '1px solid var(--bbc-border)', borderRadius: 'var(--radius-md)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '16px', color: 'var(--bbc-navy)' }}>
              Driver Details
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div className="driver-avatar" style={{ width: '56px', height: '56px', fontSize: '20px' }}>
                {ride.driver.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--bbc-navy)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{ride.driver.name}</span>
                  {ride.driver.isSuperDriver && (
                    <span className="super-driver-badge">
                      <Star size={12} weight="fill" /> Super Driver
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--bbc-text-secondary)', marginTop: '4px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Star size={15} color="#f57f17" weight="fill" />
                    <strong>{ride.driver.rating.toFixed(2)}</strong> / 5.0
                  </span>
                  <span>·</span>
                  <span>{ride.driver.completedRides} rides completed</span>
                  <span>·</span>
                  <span>Answers in ~{ride.driver.responseHours}h</span>
                </div>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--bbc-text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
              {ride.driver.bio || 'Verified Sri Lankan community driver.'}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid var(--bbc-border)', paddingTop: '16px' }}>
              {ride.driver.verifiedNic && <span style={{ fontSize: '12px', background: '#e8f5e9', color: '#2e7d32', padding: '4px 10px', borderRadius: '9999px', fontWeight: 600 }}>✓ Sri Lankan NIC Verified</span>}
              {ride.driver.verifiedPhone && <span style={{ fontSize: '12px', background: '#e8f5e9', color: '#2e7d32', padding: '4px 10px', borderRadius: '9999px', fontWeight: 600 }}>✓ +94 Phone Verified</span>}
              {ride.driver.verifiedLicence && <span style={{ fontSize: '12px', background: '#e8f5e9', color: '#2e7d32', padding: '4px 10px', borderRadius: '9999px', fontWeight: 600 }}>✓ Driving Licence Verified</span>}
            </div>
          </div>

          {/* Vehicle & Comfort Profile */}
          <div style={{ background: '#ffffff', border: '1px solid var(--bbc-border)', borderRadius: 'var(--radius-md)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '16px', color: 'var(--bbc-navy)' }}>
              Vehicle & Comfort Rules
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', fontSize: '14px' }}>
              <div><strong>Car:</strong> {ride.vehicle.makeModel}</div>
              <div><strong>AC:</strong> {ride.vehicle.acGuaranteed ? 'Guaranteed AC' : 'Standard Ventilation'}</div>
              <div><strong>Backseat:</strong> {ride.comfort.maxTwoInBack ? 'Max 2 in the back (Spacious)' : 'Standard 3 in back'}</div>
              <div><strong>Chattiness:</strong> {ride.comfort.chattiness === 'bla' ? 'Quiet type' : ride.comfort.chattiness === 'blabla' ? 'Chatty based on mood' : 'Loves to chat!'}</div>
              <div><strong>Luggage:</strong> {ride.comfort.luggage.toUpperCase()} bag allowed</div>
              <div><strong>Women Only:</strong> {ride.comfort.womenOnly ? 'Yes (Ladies Only)' : 'All travellers welcome'}</div>
              <div><strong>Music:</strong> {ride.comfort.music === 'yes' ? 'Playlist on' : 'Quiet cabin'}</div>
              <div><strong>Smoking:</strong> {ride.comfort.smoking === 'yes' ? 'Allowed' : 'Strictly No smoking'}</div>
            </div>
          </div>
        </div>

        {/* Right: Booking Box */}
        <div>
          <div style={{ background: '#ffffff', border: '1px solid var(--bbc-border)', borderRadius: 'var(--radius-md)', padding: '28px', boxShadow: 'var(--shadow-md)', position: 'sticky', top: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '13px', color: 'var(--bbc-text-secondary)', fontWeight: 700 }}>Contribution</span>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--bbc-navy)' }}>
                  {formatLkr(legCheck.legPriceLkr)}
                </div>
              </div>
              <span className="price-band-badge green">Fair Cost-Sharing</span>
            </div>

            {bookingConfirmed ? (
              <div style={{ background: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: 'var(--radius-sm)', padding: '20px', textAlign: 'center' }}>
                <CheckCircle size={48} color="#2e7d32" weight="fill" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#1b5e20' }}>
                  {bookingConfirmed.status === 'accepted' ? 'Booking Confirmed!' : 'Request Sent to Driver'}
                </h4>
                <p style={{ fontSize: '14px', color: '#2e7d32', marginTop: '6px' }}>
                  {bookingConfirmed.status === 'accepted'
                    ? `Your ${bookingConfirmed.seats} seat(s) are reserved. Please meet at ${fromStop.pickupLandmark}. Settle ${formatLkr(bookingConfirmed.totalPriceLkr)} onboard.`
                    : 'The driver has received your booking request and will accept shortly.'}
                </p>
                <div style={{ marginTop: '18px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button type="button" className="btn-primary btn-sm" onClick={() => navigate('/rides')}>
                    View in Your Rides
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {bookingError && (
                  <div style={{ padding: '10px 14px', background: 'var(--bbc-red-bg)', color: 'var(--bbc-red)', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
                    {bookingError}
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Number of Seats</label>
                  <select
                    value={seats}
                    onChange={(e) => setSeats(Number(e.target.value))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '15px' }}
                  >
                    {Array.from({ length: legCheck.availableSeatsOnLeg || 1 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'seat' : 'seats'} — {formatLkr(legCheck.legPriceLkr * n)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Onboard Settlement Method</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', border: `1px solid ${settlementMethod === 'lankaqr' ? 'var(--bbc-blue)' : 'var(--bbc-border)'}`, borderRadius: '8px', cursor: 'pointer', background: settlementMethod === 'lankaqr' ? '#f0f9ff' : 'transparent' }}>
                      <input
                        type="radio"
                        name="pay"
                        checked={settlementMethod === 'lankaqr'}
                        onChange={() => setSettlementMethod('lankaqr')}
                      />
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>LankaQR</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', border: `1px solid ${settlementMethod === 'cash_lkr' ? 'var(--bbc-blue)' : 'var(--bbc-border)'}`, borderRadius: '8px', cursor: 'pointer', background: settlementMethod === 'cash_lkr' ? '#f0f9ff' : 'transparent' }}>
                      <input
                        type="radio"
                        name="pay"
                        checked={settlementMethod === 'cash_lkr'}
                        onChange={() => setSettlementMethod('cash_lkr')}
                      />
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>Cash (LKR)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Note to Driver <span style={{ color: 'var(--bbc-text-secondary)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. I’ll be at the main entrance with one small bag."
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ borderTop: '1px solid var(--bbc-border)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                    <span>Total contribution</span>
                    <strong>{formatLkr(legCheck.legPriceLkr * seats)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--bbc-green)' }}>
                    <span>Platform booking fee</span>
                    <strong>FREE (Pilot)</strong>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!legCheck.allowed}
                  className="btn-primary"
                  style={{ width: '100%', padding: '16px' }}
                >
                  {ride.approvalMode === 'instant' ? (
                    <>
                      <Sparkle size={18} weight="fill" />
                      <span>Instant Book Seat ({formatLkr(legCheck.legPriceLkr * seats)})</span>
                    </>
                  ) : (
                    <span>Request to Book</span>
                  )}
                </button>

                <p style={{ fontSize: '12px', color: 'var(--bbc-text-secondary)', textAlign: 'center', lineHeight: 1.4 }}>
                  No online payment is taken. Pay your driver onboard via {settlementMethod === 'lankaqr' ? 'LankaQR' : 'Cash (LKR)'}.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 4. PUBLISH RIDE VIEW (6-STEP CONVERSATIONAL WIZARD)
// -------------------------------------------------------------
function PublishRideView({ state }: { state: ReturnType<typeof store.getState> }) {
  const navigate = useNavigate();
  const tomorrow = getColomboDateOffset(1);

  const [step, setStep] = useState(1);
  const [originHubId, setOriginHubId] = useState('colombo');
  const [destinationHubId, setDestinationHubId] = useState('galle');
  const [pickupLandmark, setPickupLandmark] = useState('');
  const [dropoffLandmark, setDropoffLandmark] = useState('');

  // Step 2 Route
  const routeOptions = findRouteOptions(originHubId, destinationHubId);
  const [selectedCorridorId, setSelectedCorridorId] = useState(routeOptions[0]?.corridorId || '');
  const [selectedStopovers, setSelectedStopovers] = useState<string[]>([]);
  const [boostEnabled, setBoostEnabled] = useState(true);

  // Step 3 Timing
  const [date, setDate] = useState(tomorrow);
  const [departureTime, setDepartureTime] = useState('07:30');

  // Step 4 Seats & Vehicle
  const [seats, setSeats] = useState(3);
  const [vehicleModel, setVehicleModel] = useState(state.currentUser.defaultVehicle || 'Toyota Aqua Hybrid · White');
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory>('car');
  const [acGuaranteed, setAcGuaranteed] = useState(true);
  const [maxTwoInBack, setMaxTwoInBack] = useState(true);
  const [womenOnly, setWomenOnly] = useState(false);
  const [luggage, setLuggage] = useState<'small' | 'medium' | 'large'>('medium');

  // Step 5 Pricing
  const activeRoute = routeOptions.find((r) => r.corridorId === selectedCorridorId) || routeOptions[0];
  const recPrice = calculateRecommendedLkr(activeRoute?.distanceKm || 100, activeRoute?.hasTolls ? 'included' : 'no_tolls', activeRoute?.estimatedTollLkr);
  const bounds = getContributionBounds(recPrice);
  const [priceLkr, setPriceLkr] = useState(recPrice);

  useEffect(() => {
    if (activeRoute) {
      const nextRec = calculateRecommendedLkr(activeRoute.distanceKm, activeRoute.hasTolls ? 'included' : 'no_tolls', activeRoute.estimatedTollLkr);
      setPriceLkr(nextRec);
    }
  }, [selectedCorridorId]);

  // Step 6 Approval & Notes
  const [approvalMode, setApprovalMode] = useState<ApprovalMode>('instant');
  const [notes, setNotes] = useState('Expressway tolls included. Please arrive 10 minutes early at the pickup landmark.');
  const [publishedRide, setPublishedRide] = useState<Ride | null>(null);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    const newRide = store.publishRide({
      originHubId,
      destinationHubId,
      corridorId: selectedCorridorId || activeRoute?.corridorId,
      date,
      departureTime,
      pickupLandmark,
      dropoffLandmark,
      selectedStopoverHubIds: selectedStopovers,
      boostEnabled,
      seats,
      priceLkr,
      tollPolicy: activeRoute?.hasTolls ? 'included' : 'no_tolls',
      approvalMode,
      vehicleMakeModel: vehicleModel,
      vehicleCategory,
      acGuaranteed,
      comfort: {
        chattiness: 'blabla',
        maxTwoInBack,
        luggage,
        music: 'yes',
        pets: 'no',
        smoking: 'no',
        womenOnly,
      },
      notes,
    });
    setPublishedRide(newRide);
  };

  if (publishedRide) {
    return (
      <div className="shell-narrow" style={{ padding: '64px 0', textAlign: 'center' }}>
        <CheckCircle size={64} color="var(--bbc-green)" weight="fill" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--bbc-navy)' }}>
          Your ride is live!
        </h2>
        <p style={{ color: 'var(--bbc-text-secondary)', fontSize: '16px', maxWidth: '480px', margin: '8px auto 24px' }}>
          Passengers along the corridor can now book seats. Any matching Ride Alerts have been notified.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button type="button" className="btn-primary" onClick={() => navigate(`/rides/${publishedRide.id}`)}>
            View Your Ride
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/rides')}>
            Manage in Your Rides
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shell-narrow" style={{ padding: '36px 0 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--bbc-navy)' }}>
          Publish a Ride (Step {step} of 6)
        </h1>
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bbc-text-secondary)' }}>
          {step === 1 && 'Where & Landmarks'}
          {step === 2 && 'Route & Stopovers'}
          {step === 3 && 'Date & Departure'}
          {step === 4 && 'Seats & Vehicle'}
          {step === 5 && 'LKR Contribution'}
          {step === 6 && 'Approval & Review'}
        </span>
      </div>

      <div style={{ background: '#ffffff', border: '1px solid var(--bbc-border)', borderRadius: 'var(--radius-md)', padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--bbc-navy)' }}>
              Where are you leaving from and going to?
            </h2>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Leaving from</label>
              <select
                value={originHubId}
                onChange={(e) => setOriginHubId(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '15px' }}
              >
                {HUBS.map((h) => (
                  <option key={h.id} value={h.id}>{h.name.en} {h.isExpresswayInterchange ? '⚡' : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Pickup Landmark Meeting Point</label>
              <input
                type="text"
                placeholder="e.g. Fort Railway Station front entrance"
                value={pickupLandmark}
                onChange={(e) => setPickupLandmark(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '15px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Going to</label>
              <select
                value={destinationHubId}
                onChange={(e) => setDestinationHubId(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '15px' }}
              >
                {HUBS.filter((h) => h.id !== originHubId).map((h) => (
                  <option key={h.id} value={h.id}>{h.name.en} {h.isExpresswayInterchange ? '⚡' : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Drop-off Landmark</label>
              <input
                type="text"
                placeholder="e.g. Galle Fort Clock Tower / Main Gate"
                value={dropoffLandmark}
                onChange={(e) => setDropoffLandmark(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '15px' }}
              />
            </div>
            <button type="button" className="btn-primary" onClick={() => setStep(2)}>
              Continue to Route Selection →
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--bbc-navy)' }}>
              Choose your Sri Lankan Highway Corridor
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {routeOptions.map((opt) => (
                <label
                  key={opt.corridorId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    border: `2px solid ${selectedCorridorId === opt.corridorId ? 'var(--bbc-blue)' : 'var(--bbc-border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    background: selectedCorridorId === opt.corridorId ? '#f0f9ff' : 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="radio"
                      name="corridor"
                      checked={selectedCorridorId === opt.corridorId}
                      onChange={() => setSelectedCorridorId(opt.corridorId)}
                    />
                    <div>
                      <strong style={{ fontSize: '15px', color: 'var(--bbc-navy)' }}>{opt.corridorName}</strong>
                      <div style={{ fontSize: '13px', color: 'var(--bbc-text-secondary)' }}>
                        {opt.distanceKm} km · ~{Math.round(opt.durationMinutes / 60)}h {opt.durationMinutes % 60}m
                        {opt.hasTolls ? ' · Tolls apply' : ' · Free scenic route'}
                      </div>
                    </div>
                  </div>
                  {opt.hasTolls && <span style={{ fontSize: '12px', fontWeight: 700, color: '#00875a', background: '#e3fcef', padding: '3px 8px', borderRadius: '9999px' }}>Expressway</span>}
                </label>
              ))}
            </div>

            {activeRoute && activeRoute.intermediateHubs.length > 0 && (
              <div style={{ borderTop: '1px solid var(--bbc-border)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>Declared Stopovers (Get more passengers)</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {activeRoute.intermediateHubs.map((hubId) => {
                    const hub = getHubById(hubId);
                    const isSelected = selectedStopovers.includes(hubId);
                    return (
                      <button
                        key={hubId}
                        type="button"
                        onClick={() => {
                          setSelectedStopovers(
                            isSelected ? selectedStopovers.filter((id) => id !== hubId) : [...selectedStopovers, hubId]
                          );
                        }}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '9999px',
                          fontSize: '13px',
                          fontWeight: 700,
                          border: `1px solid ${isSelected ? 'var(--bbc-blue)' : 'var(--bbc-border)'}`,
                          background: isSelected ? 'var(--bbc-blue)' : 'var(--bbc-surface)',
                          color: isSelected ? '#ffffff' : 'var(--bbc-navy)',
                        }}
                      >
                        {isSelected ? '✓ ' : '+ '} {hub?.name.en}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer', background: '#fff3e0', padding: '12px', borderRadius: '8px' }}>
              <input type="checkbox" checked={boostEnabled} onChange={(e) => setBoostEnabled(e.target.checked)} />
              <div>
                <strong>Enable Boost partial-leg matching</strong>
                <div style={{ fontSize: '12px', color: '#e65100' }}>
                  Automatically allow passengers along your highway corridor to book empty segments.
                </div>
              </div>
            </label>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
              <button type="button" className="btn-primary" style={{ flex: 1 }} onClick={() => setStep(3)}>Continue to Timing →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--bbc-navy)' }}>
              When are you driving?
            </h2>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Travel Date</label>
              <input
                type="date"
                min={getColomboDateOffset(0)}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '15px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Departure Time (Colombo Time)</label>
              <input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '15px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" className="btn-secondary" onClick={() => setStep(2)}>← Back</button>
              <button type="button" className="btn-primary" style={{ flex: 1 }} onClick={() => setStep(4)}>Continue to Seats & Vehicle →</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--bbc-navy)' }}>
              Seats & Comfort Preferences
            </h2>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Number of Passengers you can take</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSeats(n)}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '9999px',
                      fontWeight: 800,
                      border: `2px solid ${seats === n ? 'var(--bbc-blue)' : 'var(--bbc-border)'}`,
                      background: seats === n ? 'var(--bbc-blue)' : '#ffffff',
                      color: seats === n ? '#ffffff' : 'var(--bbc-navy)',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Vehicle Make & Model</label>
              <input
                type="text"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="e.g. Toyota Aqua · Silver"
                style={{ width: '100%', padding: '12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '15px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <label className="filter-option" style={{ padding: '10px', border: '1px solid var(--bbc-border)', borderRadius: '8px' }}>
                <input type="checkbox" checked={acGuaranteed} onChange={(e) => setAcGuaranteed(e.target.checked)} />
                <span>Air Conditioning (AC)</span>
              </label>
              <label className="filter-option" style={{ padding: '10px', border: '1px solid var(--bbc-border)', borderRadius: '8px' }}>
                <input type="checkbox" checked={maxTwoInBack} onChange={(e) => setMaxTwoInBack(e.target.checked)} />
                <span>Max 2 in the back</span>
              </label>
              <label className="filter-option" style={{ padding: '10px', border: '1px solid var(--bbc-border)', borderRadius: '8px' }}>
                <input type="checkbox" checked={womenOnly} onChange={(e) => setWomenOnly(e.target.checked)} />
                <span>Women Only Ride</span>
              </label>
              <div>
                <select
                  value={luggage}
                  onChange={(e) => setLuggage(e.target.value as any)}
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '14px' }}
                >
                  <option value="small">Small Bag Only</option>
                  <option value="medium">Medium Bag Included</option>
                  <option value="large">Large Suitcase Allowed</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" className="btn-secondary" onClick={() => setStep(3)}>← Back</button>
              <button type="button" className="btn-primary" style={{ flex: 1 }} onClick={() => setStep(5)}>Continue to Pricing →</button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--bbc-navy)' }}>
              Set Passenger Cost-Sharing Contribution (LKR)
            </h2>

            <p style={{ color: 'var(--bbc-text-secondary)', fontSize: '14px' }}>
              BlaBlaLanka is a cost-sharing platform, not a commercial taxi. We recommend a fair rate based on distance (~LKR 20/km) and highway tolls to prevent unlawful commercial profiting.
            </p>

            <div style={{ background: 'var(--bbc-surface-subtle)', border: '1px solid var(--bbc-border)', borderRadius: 'var(--radius-md)', padding: '24px', textAlign: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bbc-text-secondary)' }}>
                Recommended Price: {formatLkr(recPrice)} (Max: {formatLkr(bounds.maxLkr)})
              </span>

              <div style={{ margin: '16px auto', width: 'fit-content' }}>
                <div className="price-stepper-box">
                  <button
                    type="button"
                    className="stepper-btn"
                    disabled={priceLkr <= bounds.minLkr}
                    onClick={() => setPriceLkr(stepContributionLkr(priceLkr, -1, bounds))}
                  >
                    –
                  </button>
                  <span className="stepper-val">{formatLkr(priceLkr)}</span>
                  <button
                    type="button"
                    className="stepper-btn"
                    disabled={priceLkr >= bounds.maxLkr}
                    onClick={() => setPriceLkr(stepContributionLkr(priceLkr, 1, bounds))}
                  >
                    +
                  </button>
                </div>
              </div>

              <span className={`price-band-badge ${getPriceBand(priceLkr, recPrice)}`}>
                {getPriceBand(priceLkr, recPrice) === 'green' && 'Great Price · Fills Seats Fast'}
                {getPriceBand(priceLkr, recPrice) === 'amber' && 'Moderate Contribution'}
                {getPriceBand(priceLkr, recPrice) === 'red' && 'Near Cost-Sharing Cap'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" className="btn-secondary" onClick={() => setStep(4)}>← Back</button>
              <button type="button" className="btn-primary" style={{ flex: 1 }} onClick={() => setStep(6)}>Continue to Review →</button>
            </div>
          </div>
        )}

        {step === 6 && (
          <form onSubmit={handlePublish} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--bbc-navy)' }}>
              Approval Mode & Notes
            </h2>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                Can passengers book instantly?
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label
                  style={{
                    padding: '16px',
                    border: `2px solid ${approvalMode === 'instant' ? 'var(--bbc-blue)' : 'var(--bbc-border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    background: approvalMode === 'instant' ? '#f0f9ff' : 'transparent',
                  }}
                >
                  <input
                    type="radio"
                    name="approval"
                    checked={approvalMode === 'instant'}
                    onChange={() => setApprovalMode('instant')}
                  />
                  <div style={{ marginTop: '8px' }}>
                    <strong style={{ color: 'var(--bbc-navy)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sparkle size={16} weight="fill" color="var(--bbc-blue)" /> Instant Booking
                    </strong>
                    <p style={{ fontSize: '12px', color: 'var(--bbc-text-secondary)', marginTop: '4px' }}>
                      Passengers book instantly. Recommended for getting more travellers.
                    </p>
                  </div>
                </label>

                <label
                  style={{
                    padding: '16px',
                    border: `2px solid ${approvalMode === 'manual' ? 'var(--bbc-blue)' : 'var(--bbc-border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    background: approvalMode === 'manual' ? '#f0f9ff' : 'transparent',
                  }}
                >
                  <input
                    type="radio"
                    name="approval"
                    checked={approvalMode === 'manual'}
                    onChange={() => setApprovalMode('manual')}
                  />
                  <div style={{ marginTop: '8px' }}>
                    <strong style={{ color: 'var(--bbc-navy)' }}>Manual Request</strong>
                    <p style={{ fontSize: '12px', color: 'var(--bbc-text-secondary)', marginTop: '4px' }}>
                      You review and accept each passenger’s request before their seat is reserved.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Notes for Passengers
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ background: '#f4f6f8', padding: '16px', borderRadius: '8px', fontSize: '13px', color: 'var(--bbc-text-secondary)' }}>
              <strong>Summary:</strong> {getHubById(originHubId)?.name.en} → {getHubById(destinationHubId)?.name.en} on {date} at {departureTime} · {seats} seats at {formatLkr(priceLkr)} per seat ({approvalMode === 'instant' ? 'Instant Booking' : 'Manual Request'}).
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" className="btn-secondary" onClick={() => setStep(5)}>← Back</button>
              <button type="submit" className="btn-primary" style={{ flex: 1, padding: '16px' }}>
                Publish Your Ride
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 5. YOUR RIDES, BOOKINGS, ANTI-SCAM CHAT & RATINGS VIEW
// -------------------------------------------------------------
function YourRidesView({ state }: { state: ReturnType<typeof store.getState> }) {
  const [tab, setTab] = useState<'passenger' | 'driver'>('passenger');
  const [activeChatBookingId, setActiveChatBookingId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatWarning, setChatWarning] = useState<string | null>(null);

  // Rating Modal
  const [activeRatingBookingId, setActiveRatingBookingId] = useState<string | null>(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [drivingSkill, setDrivingSkill] = useState<'poor' | 'average' | 'excellent'>('excellent');
  const [ratingComment, setRatingComment] = useState('');

  const myBookings = state.bookings;
  const myRides = state.rides.filter((r) => r.driverId === state.currentUser.id);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatBookingId || !chatInput.trim()) return;
    setChatWarning(null);
    const res = store.sendMessage(activeChatBookingId, chatInput);
    if (!res.allowed) {
      setChatWarning(res.warningMessage || 'Message blocked.');
    } else {
      setChatInput('');
    }
  };

  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRatingBookingId) return;
    const bk = state.bookings.find((b) => b.id === activeRatingBookingId);
    if (!bk) return;
    const ride = state.rides.find((r) => r.id === bk.rideId);
    if (!ride) return;

    store.submitDoubleBlindRating({
      bookingId: activeRatingBookingId,
      fromUserId: state.currentUser.id,
      toUserId: ride.driverId,
      stars: ratingStars,
      drivingSkill,
      comment: ratingComment,
    });
    setActiveRatingBookingId(null);
  };

  return (
    <div className="shell" style={{ padding: '36px 0 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--bbc-navy)' }}>
          Your Rides & Bookings
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={tab === 'passenger' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
            onClick={() => setTab('passenger')}
          >
            As Passenger ({myBookings.length})
          </button>
          <button
            type="button"
            className={tab === 'driver' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
            onClick={() => setTab('driver')}
          >
            As Driver ({myRides.length})
          </button>
        </div>
      </div>

      {tab === 'passenger' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {myBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 20px', background: 'var(--bbc-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
              <Car size={48} color="var(--bbc-text-secondary)" weight="duotone" />
              <h3 style={{ fontSize: '18px', fontWeight: 800, marginTop: '16px', color: 'var(--bbc-navy)' }}>
                No passenger bookings yet
              </h3>
              <p style={{ color: 'var(--bbc-text-secondary)', margin: '8px 0 20px' }}>
                Search for an upcoming trip across Sri Lanka and reserve a seat.
              </p>
              <Link to="/search" className="btn-primary">Find a ride</Link>
            </div>
          ) : (
            myBookings.map((bk) => {
              const ride = state.rides.find((r) => r.id === bk.rideId);
              const fromName = getHubById(bk.fromHubId)?.name.en || bk.fromHubId;
              const toName = getHubById(bk.toHubId)?.name.en || bk.toHubId;
              const visibleRatings = store.getVisibleRatingsForBooking(bk.id);

              return (
                <div key={bk.id} style={{ background: '#ffffff', border: '1px solid var(--bbc-border)', borderRadius: 'var(--radius-md)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--bbc-text-secondary)', textTransform: 'uppercase' }}>
                        {ride ? formatColomboDate(ride.departureAt) : 'Upcoming'}
                      </span>
                      <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--bbc-navy)', marginTop: '2px' }}>
                        {fromName} → {toName}
                      </h3>
                      <div style={{ fontSize: '14px', color: 'var(--bbc-text-secondary)', marginTop: '4px' }}>
                        {bk.seats} seats · Total {formatLkr(bk.totalPriceLkr)} · Settle via {bk.settlementMethod === 'lankaqr' ? 'LankaQR' : 'Cash (LKR)'}
                      </div>
                    </div>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: bk.status === 'accepted' ? 'var(--bbc-green-bg)' : bk.status === 'pending' ? 'var(--bbc-amber-bg)' : 'var(--bbc-red-bg)',
                      color: bk.status === 'accepted' ? 'var(--bbc-green)' : bk.status === 'pending' ? 'var(--bbc-amber)' : 'var(--bbc-red)',
                    }}>
                      {bk.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--bbc-border)', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => setActiveChatBookingId(bk.id)}
                      >
                        <ChatCircleText size={16} />
                        <span>Chat & Anti-Scam Guard</span>
                      </button>

                      {bk.status === 'accepted' && ride && (
                        <a
                          href={`https://wa.me/94772345678?text=${encodeURIComponent(`Hi ${ride.driver.name}, joining your ${fromName} to ${toName} BlaBlaLanka ride!`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary btn-sm"
                          style={{ color: '#2e7d32' }}
                        >
                          <WhatsappLogo size={16} weight="fill" />
                          <span>WhatsApp</span>
                        </a>
                      )}

                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => setActiveRatingBookingId(bk.id)}
                      >
                        <Star size={16} color="#f57f17" weight="fill" />
                        <span>Rate Driver</span>
                      </button>
                    </div>

                    {bk.status === 'pending' && (
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        style={{ color: 'var(--bbc-red)' }}
                        onClick={() => store.cancelBooking(bk.id)}
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>

                  {visibleRatings.length > 0 && (
                    <div style={{ marginTop: '16px', background: '#fafbfc', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                      <strong>Reviews for this trip:</strong>
                      {visibleRatings.map((r) => (
                        <div key={r.id} style={{ marginTop: '4px' }}>
                          ★ {r.stars}/5: "{r.comment}"
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'driver' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {myRides.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 20px', background: 'var(--bbc-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
              <PlusCircle size={48} color="var(--bbc-text-secondary)" weight="duotone" />
              <h3 style={{ fontSize: '18px', fontWeight: 800, marginTop: '16px', color: 'var(--bbc-navy)' }}>
                You haven't offered any rides yet
              </h3>
              <p style={{ color: 'var(--bbc-text-secondary)', margin: '8px 0 20px' }}>
                Driving somewhere in Sri Lanka? Offer your empty seats to split fuel and expressway tolls.
              </p>
              <Link to="/publish" className="btn-primary">Offer a ride</Link>
            </div>
          ) : (
            myRides.map((ride) => {
              const rideRequests = state.bookings.filter((b) => b.rideId === ride.id);
              const fromName = getHubById(ride.originHubId)?.name.en || ride.originHubId;
              const toName = getHubById(ride.destinationHubId)?.name.en || ride.destinationHubId;

              return (
                <div key={ride.id} style={{ background: '#ffffff', border: '1px solid var(--bbc-border)', borderRadius: 'var(--radius-md)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--bbc-text-secondary)', textTransform: 'uppercase' }}>
                        {formatColomboDate(ride.departureAt)} · {formatColomboTime(ride.departureAt)}
                      </span>
                      <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--bbc-navy)', marginTop: '2px' }}>
                        {fromName} → {toName}
                      </h3>
                      <div style={{ fontSize: '14px', color: 'var(--bbc-text-secondary)', marginTop: '4px' }}>
                        {ride.totalSeats} seats offered · {formatLkr(ride.fullPriceLkr)} full price · {ride.approvalMode === 'instant' ? 'Instant Booking' : 'Manual Request'}
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, background: '#e1f5fe', color: '#0288d1', padding: '4px 10px', borderRadius: '9999px' }}>
                      {ride.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Passenger Requests List */}
                  <div style={{ borderTop: '1px solid var(--bbc-border)', paddingTop: '16px', marginTop: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>
                      Passenger Requests ({rideRequests.length})
                    </h4>
                    {rideRequests.length === 0 ? (
                      <p style={{ fontSize: '13px', color: 'var(--bbc-text-secondary)' }}>No passenger requests yet for this ride.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {rideRequests.map((req) => (
                          <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bbc-surface)', borderRadius: '8px', fontSize: '14px' }}>
                            <div>
                              <strong>{req.passengerName}</strong> — {req.seats} seats ({getHubById(req.fromHubId)?.name.en} → {getHubById(req.toHubId)?.name.en}) · {formatLkr(req.totalPriceLkr)}
                              {req.message && <div style={{ fontSize: '12px', color: 'var(--bbc-text-secondary)', marginTop: '2px' }}>"{req.message}"</div>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{req.status}</span>
                              {req.status === 'pending' && (
                                <>
                                  <button
                                    type="button"
                                    className="btn-primary btn-sm"
                                    style={{ padding: '4px 10px', fontSize: '12px' }}
                                    onClick={() => store.respondToBooking(req.id, true)}
                                  >
                                    Accept
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-secondary btn-sm"
                                    style={{ padding: '4px 10px', fontSize: '12px' }}
                                    onClick={() => store.respondToBooking(req.id, false)}
                                  >
                                    Decline
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                className="btn-secondary btn-sm"
                                style={{ padding: '4px 10px', fontSize: '12px' }}
                                onClick={() => setActiveChatBookingId(req.id)}
                              >
                                Chat
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Anti-Scam Chat Drawer Modal */}
      {activeChatBookingId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 71, 82, 0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', padding: '24px', maxWidth: '520px', width: '100%', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--bbc-border)', paddingBottom: '12px', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--bbc-navy)' }}>
                  Ride Coordination Chat
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--bbc-text-secondary)' }}>
                  Anti-scam link protection active
                </span>
              </div>
              <button type="button" onClick={() => setActiveChatBookingId(null)}><X size={20} /></button>
            </div>

            <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', color: '#795548', marginBottom: '12px' }}>
              <strong>Stay Safe:</strong> External payment links and advance transfer requests are blocked. Settle in person via Cash or LankaQR.
            </div>

            {/* Message list */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px 0', minHeight: '160px' }}>
              {state.messages.filter((m) => m.bookingId === activeChatBookingId).length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--bbc-text-secondary)', fontSize: '13px', margin: 'auto' }}>
                  No messages yet. Send a hello to coordinate!
                </div>
              ) : (
                state.messages
                  .filter((m) => m.bookingId === activeChatBookingId)
                  .map((msg) => {
                    const isMe = msg.senderId === state.currentUser.id;
                    return (
                      <div
                        key={msg.id}
                        style={{
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          background: isMe ? 'var(--bbc-blue)' : 'var(--bbc-surface)',
                          color: isMe ? '#ffffff' : 'var(--bbc-navy)',
                          padding: '8px 12px',
                          borderRadius: '12px',
                          maxWidth: '75%',
                          fontSize: '14px',
                        }}
                      >
                        <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '2px' }}>{msg.senderName}</div>
                        <div>{msg.text}</div>
                      </div>
                    );
                  })
              )}
            </div>

            {chatWarning && (
              <div style={{ background: '#ffebee', color: '#c62828', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '8px' }}>
                {chatWarning}
              </div>
            )}

            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <input
                type="text"
                placeholder="Type a message (e.g. See you at Fort main entrance)"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                style={{ flex: 1, padding: '10px 12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '14px' }}
              />
              <button type="submit" className="btn-primary btn-sm">Send</button>
            </form>
          </div>
        </div>
      )}

      {/* Double-Blind Rating Modal */}
      {activeRatingBookingId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 71, 82, 0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', padding: '28px', maxWidth: '460px', width: '100%', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--bbc-navy)' }}>
                Rate Your Ride
              </h3>
              <button type="button" onClick={() => setActiveRatingBookingId(null)}><X size={20} /></button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--bbc-text-secondary)', marginBottom: '16px' }}>
              BlaBlaLanka uses <strong>Double-Blind Ratings</strong>: your rating remains hidden until the other party submits theirs or 14 days pass.
            </p>

            <form onSubmit={handleRatingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Overall Rating</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingStars(star)}
                      style={{ fontSize: '24px', color: star <= ratingStars ? '#f57f17' : '#c2cbd0' }}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Anonymous Driving Skills Evaluation</label>
                <select
                  value={drivingSkill}
                  onChange={(e) => setDrivingSkill(e.target.value as any)}
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '14px' }}
                >
                  <option value="excellent">Excellent — felt safe and relaxed</option>
                  <option value="average">Average — standard driving</option>
                  <option value="poor">Poor — needs improvement</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Written Feedback</label>
                <textarea
                  rows={3}
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="How was the journey? Was the driver on time?"
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit' }}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                Submit Blind Rating
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 6. PROFILE & SRI LANKAN TRUST HUB VIEW
// -------------------------------------------------------------
function ProfileView({ state }: { state: ReturnType<typeof store.getState> }) {
  const user = state.currentUser;

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [nicNumber, setNicNumber] = useState(user.nicNumber);
  const [licenceNumber, setLicenceNumber] = useState(user.licenceNumber);
  const [defaultVehicle, setDefaultVehicle] = useState(user.defaultVehicle);
  const [bio, setBio] = useState(user.bio);
  const [comfort, setComfort] = useState(user.comfort);

  const [updateMsg, setUpdateMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateMsg(null);
    const res = store.updateUserVerification({
      name,
      phone,
      nicNumber,
      licenceNumber,
      defaultVehicle,
      bio,
      comfort,
    });
    if (res.ok) {
      setUpdateMsg({ ok: true, text: 'Profile & Sri Lankan Verification updated successfully!' });
    } else {
      setUpdateMsg({ ok: false, text: res.error || 'Update failed.' });
    }
  };

  return (
    <div className="shell-narrow" style={{ padding: '36px 0 80px' }}>
      <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--bbc-navy)', marginBottom: '8px' }}>
        Profile & Sri Lankan Verification Hub
      </h1>
      <p style={{ color: 'var(--bbc-text-secondary)', fontSize: '15px', marginBottom: '28px' }}>
        Verified profiles build trust in the Sri Lankan carpooling community. Verify your National Identity Card (NIC) and mobile number to unlock higher booking confidence and Super Driver status.
      </p>

      {/* Super Driver Checklist Box */}
      <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 'var(--radius-md)', padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Star size={20} color="#f57f17" weight="fill" />
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#f57f17' }}>Super Driver Qualification Status</h3>
        </div>
        <p style={{ fontSize: '13px', color: '#795548', marginBottom: '14px' }}>
          Super Drivers respond in under 3 hours, maintain a 4.7+ rating, a 2.8+ driving score, and have verified identity documents.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
          <div style={{ color: user.verifiedPhone && user.verifiedNic ? '#2e7d32' : '#c62828' }}>
            {user.verifiedPhone && user.verifiedNic ? '✓' : '✗'} Verified NIC & +94 Phone
          </div>
          <div style={{ color: user.overallRating >= 4.7 ? '#2e7d32' : '#c62828' }}>
            {user.overallRating >= 4.7 ? '✓' : '✗'} 4.7+ Rating ({user.overallRating.toFixed(2)})
          </div>
          <div style={{ color: user.drivingSkillScore >= 2.8 ? '#2e7d32' : '#c62828' }}>
            {user.drivingSkillScore >= 2.8 ? '✓' : '✗'} 2.8+ Driving Skill ({user.drivingSkillScore.toFixed(2)})
          </div>
          <div style={{ color: user.cancellationRatePercent < 5 ? '#2e7d32' : '#c62828' }}>
            {user.cancellationRatePercent < 5 ? '✓' : '✗'} Low Cancellation ({user.cancellationRatePercent}%)
          </div>
        </div>
      </div>

      <div style={{ background: '#ffffff', border: '1px solid var(--bbc-border)', borderRadius: 'var(--radius-md)', padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
        {updateMsg && (
          <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: 600, background: updateMsg.ok ? '#e8f5e9' : '#ffebee', color: updateMsg.ok ? '#2e7d32' : '#c62828' }}>
            {updateMsg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '15px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
              Sri Lankan Mobile Number (+94 7X XXX XXXX)
            </label>
            <input
              type="text"
              required
              placeholder="+94771234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: '100%', padding: '12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '15px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Sri Lankan NIC (9-digit V/X or 12-digit)
              </label>
              <input
                type="text"
                required
                placeholder="199614502341 or 921451234V"
                value={nicNumber}
                onChange={(e) => setNicNumber(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '15px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Driving Licence Number (for drivers)
              </label>
              <input
                type="text"
                placeholder="e.g. B1234567"
                value={licenceNumber}
                onChange={(e) => setLicenceNumber(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '15px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Default Vehicle</label>
            <input
              type="text"
              value={defaultVehicle}
              onChange={(e) => setDefaultVehicle(e.target.value)}
              placeholder="e.g. Honda Civic RS · Grey"
              style={{ width: '100%', padding: '12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '15px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Bio & Traveller Summary</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other community members what makes you good company."
              style={{ width: '100%', padding: '12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit' }}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '16px' }}>
            Save Profile & Verification Details
          </button>
        </form>
      </div>
    </div>
  );
}
