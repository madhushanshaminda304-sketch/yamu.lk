import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MagnifyingGlass,
  ArrowsLeftRight,
  ShieldCheck,
  Coins,
  Sparkle,
  ArrowRight,
  Crosshair,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { HUBS, ALL_HUBS } from '../domain/corridors.ts';
import { t, getColomboDateOffset } from '../domain/i18n.ts';
import { getCurrentLocation, findNearestHub } from '../native/geolocation.ts';
import { triggerHaptic } from '../native/haptics.ts';
import type { MarketplaceState } from '../state/store.ts';

export function HomeView({ state }: { state: MarketplaceState }) {
  const navigate = useNavigate();
  const locale = state.locale;
  const tomorrow = getColomboDateOffset(1);

  const [fromHubId, setFromHubId] = useState('colombo');
  const [toHubId, setToHubId] = useState('galle');
  const [date, setDate] = useState(tomorrow);
  const [seats, setSeats] = useState(1);
  const [isLocating, setIsLocating] = useState(false);

  const handleUseLocation = async () => {
    try {
      setIsLocating(true);
      await triggerHaptic('selection');
      const coords = await getCurrentLocation();
      const nearest = findNearestHub(coords, ALL_HUBS);
      setFromHubId(nearest.hub.id);
      await triggerHaptic('success');
      const langKey = locale.slice(0, 2) as 'en' | 'si' | 'ta';
      const hubName = nearest.hub.name[langKey] || nearest.hub.name.en;
      toast.success(`${t(locale, 'location.located')}${hubName} (${nearest.distanceKm} km)`);
    } catch {
      toast.error(t(locale, 'location.denied'));
    } finally {
      setIsLocating(false);
    }
  };

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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <label htmlFor="home-from-select">{t(locale, 'search.from')}</label>
                  <button
                    type="button"
                    onClick={handleUseLocation}
                    disabled={isLocating}
                    style={{
                      background: 'var(--yamo-surface-tint, #f0fdf4)',
                      border: '1px solid #d1fae5',
                      color: 'var(--yamo-emerald, #047857)',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '9999px',
                      flexShrink: 0,
                    }}
                    title={t(locale, 'location.use_my_location')}
                    aria-label={t(locale, 'location.use_my_location')}
                  >
                    <Crosshair size={13} weight="bold" />
                    <span>{isLocating ? t(locale, 'location.locating') : t(locale, 'location.use_my_location')}</span>
                  </button>
                </div>
                <select id="home-from-select" value={fromHubId} onChange={(e) => setFromHubId(e.target.value)}>
                  {HUBS.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name[locale.slice(0, 2) as 'en' | 'si' | 'ta'] || h.name.en} {h.isExpresswayInterchange ? '⚡ (MMC/Exit)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <button type="button" className="swap-btn" onClick={handleSwap} aria-label="Swap Route Departure and Destination">
                <ArrowsLeftRight size={18} weight="bold" />
              </button>

              <div className="search-field">
                <label htmlFor="home-to-select">{t(locale, 'search.to')}</label>
                <select id="home-to-select" value={toHubId} onChange={(e) => setToHubId(e.target.value)}>
                  {HUBS.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name[locale.slice(0, 2) as 'en' | 'si' | 'ta'] || h.name.en} {h.isExpresswayInterchange ? '⚡ (MMC/Exit)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="search-field">
                <label htmlFor="home-date-input">{t(locale, 'search.when')}</label>
                <input
                  id="home-date-input"
                  type="date"
                  min={getColomboDateOffset(0)}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="search-field">
                <label htmlFor="home-seats-select">{t(locale, 'search.seats')}</label>
                <select id="home-seats-select" value={seats} onChange={(e) => setSeats(Number(e.target.value))}>
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
