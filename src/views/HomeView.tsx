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
  House,
  Briefcase,
  GraduationCap,
  MapPin,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { HUBS, ALL_HUBS, getHubById } from '../domain/corridors.ts';
import { t, getColomboDateOffset } from '../domain/i18n.ts';
import { getCurrentLocation, findNearestHub } from '../native/geolocation.ts';
import { triggerHaptic } from '../native/haptics.ts';
import type { MarketplaceState } from '../state/store.ts';
import { FuelAndTollCalculator } from '../components/FuelAndTollCalculator.tsx';
import { COMMUTE_CORRIDORS } from '../domain/passengerRequests.ts';
import { PassengerRequestCard } from '../components/PassengerRequestCard.tsx';

export function HomeView({ state }: { state: MarketplaceState }) {
  const navigate = useNavigate();
  const locale = state.locale;
  const tomorrow = getColomboDateOffset(1);

  const [fromHubId, setFromHubId] = useState('colombo');
  const [toHubId, setToHubId] = useState('galle');
  const [date, setDate] = useState(tomorrow);
  const [seats, setSeats] = useState(1);
  const [isLocating, setIsLocating] = useState(false);
  const [isCommuteMode, setIsCommuteMode] = useState(false);

  const savedPlaces = state.currentUser?.savedPlaces && state.currentUser.savedPlaces.length > 0
    ? state.currentUser.savedPlaces
    : [
        { id: 'def-1', label: 'home' as const, title: 'Colombo', hubId: 'colombo' },
        { id: 'def-2', label: 'work' as const, title: 'Makumbura MMC', hubId: 'makumbura' },
        { id: 'def-3', label: 'university' as const, title: 'Kandy Hub', hubId: 'kandy' },
      ];

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
    const commuteFlag = isCommuteMode ? '&commute=1' : '';
    navigate(`/search?from=${fromHubId}&to=${toHubId}&date=${date}&seats=${seats}${commuteFlag}`);
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

            {/* 1-Tap Commute Shortcut Chips */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderTop: '1px solid #e2e8f0',
                background: '#f8fafc',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setIsCommuteMode(!isCommuteMode);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 800,
                  background: isCommuteMode ? '#174D3A' : '#ecfdf5',
                  color: isCommuteMode ? '#ffffff' : '#047857',
                  border: isCommuteMode ? '1px solid #174D3A' : '1px solid #a7f3d0',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
              >
                <span>🔁</span>
                <span>{t(locale, 'commute.toggle')}</span>
              </button>

              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                Quick Hubs:
              </span>
              {savedPlaces.map((place) => {
                const hub = getHubById(place.hubId);
                const hubName = hub?.name.en ?? place.hubId;
                const isSelected = toHubId === place.hubId;
                return (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      if (fromHubId === place.hubId) {
                        setFromHubId(place.hubId === 'colombo' ? 'makumbura' : 'colombo');
                      }
                      setToHubId(place.hubId);
                      toast.success(`Destination set to ${place.title} (${hubName})`);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 11px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: isSelected ? 700 : 600,
                      background: isSelected ? '#047857' : '#ffffff',
                      color: isSelected ? '#ffffff' : '#1e293b',
                      border: isSelected ? '1px solid #047857' : '1px solid #cbd5e1',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {place.label === 'home' ? <House size={13} weight={isSelected ? 'fill' : 'bold'} /> :
                     place.label === 'work' ? <Briefcase size={13} weight={isSelected ? 'fill' : 'bold'} /> :
                     place.label === 'university' ? <GraduationCap size={13} weight={isSelected ? 'fill' : 'bold'} /> :
                     <MapPin size={13} weight={isSelected ? 'fill' : 'bold'} />}
                    <span>{place.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Weekday Office & Campus Commute Panel */}
            {isCommuteMode && (
              <div
                style={{
                  padding: '12px 16px',
                  background: '#f0fdf4',
                  borderTop: '1px solid #d1fae5',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#047857', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🔁</span>
                    <span>Daily Office & Campus Commute Pass (Mon–Fri)</span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#065f46', background: '#d1fae5', padding: '2px 8px', borderRadius: '4px' }}>
                    Save up to LKR 14,000/week
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#334155' }}>
                  Split fuel & tolls 5 days/week on high-congestion corridors with verified regular carpoolers:
                </div>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {COMMUTE_CORRIDORS.map((c) => {
                    const isCorridorActive = fromHubId === c.originHubId && toHubId === c.destinationHubId;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setFromHubId(c.originHubId);
                          setToHubId(c.destinationHubId);
                          toast.success(`Commute route set: ${c.title}`);
                        }}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: isCorridorActive ? '2px solid #047857' : '1px solid #cbd5e1',
                          background: isCorridorActive ? '#ffffff' : '#f8fafc',
                          color: '#1e293b',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          display: 'inline-flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: '2px',
                          boxShadow: isCorridorActive ? '0 2px 4px rgba(4, 120, 87, 0.15)' : 'none',
                        }}
                      >
                        <span style={{ color: '#047857', fontWeight: 800 }}>{c.title}</span>
                        <span style={{ fontSize: '10.5px', color: '#64748b' }}>{c.highlights}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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

      {/* Split the Toll & Fuel Calculator Section */}
      <FuelAndTollCalculator />

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
            <div style={{ marginTop: '8px', fontSize: '11px', fontWeight: 700, color: '#047857', background: 'rgba(236, 253, 245, 0.9)', padding: '4px 9px', borderRadius: '6px', border: '1px solid #d1fae5', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Includes E04 Toll (LKR 300) + Fuel Split • Save 67% vs Solo Drive
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
            <div style={{ marginTop: '8px', fontSize: '11px', fontWeight: 700, color: '#047857', background: 'rgba(236, 253, 245, 0.9)', padding: '4px 9px', borderRadius: '6px', border: '1px solid #d1fae5', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Includes E01 Toll (LKR 500) + Fuel Split • Save 67% vs Solo Drive
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
            <div style={{ marginTop: '8px', fontSize: '11px', fontWeight: 700, color: '#047857', background: 'rgba(236, 253, 245, 0.9)', padding: '4px 9px', borderRadius: '6px', border: '1px solid #d1fae5', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Includes E01 Toll (LKR 650) + Fuel Split • Save 67% vs Solo Drive
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
            <div style={{ marginTop: '8px', fontSize: '11px', fontWeight: 700, color: '#047857', background: 'rgba(236, 253, 245, 0.9)', padding: '4px 9px', borderRadius: '6px', border: '1px solid #d1fae5', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Includes E03 Toll (LKR 350) + A9 Fuel Split • Save 72% vs Solo Drive
            </div>
          </Link>
        </div>
      </section>

      {/* Waiting Passenger Requests Live Preview Strip */}
      <section className="shell" style={{ padding: '36px 0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#047857', background: '#ecfdf5', padding: '4px 10px', borderRadius: '9999px', border: '1px solid #a7f3d0', marginBottom: '6px' }}>
              <span>🙋‍♂️ {t(locale, 'requests.title')}</span>
              <span>• Two-Way Marketplace</span>
            </div>
            <h2 style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 800, color: 'var(--bbc-navy)', margin: 0 }}>
              {t(locale, 'requests.subtitle')}
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>
              Driving these corridors with empty seats? Offer a ride to verified passengers and split your fuel + expressway tolls.
            </p>
          </div>

          <Link
            to="/search?tab=requests"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13.5px',
              fontWeight: 700,
              color: '#047857',
              background: '#ffffff',
              border: '1px solid #a7f3d0',
              padding: '8px 16px',
              borderRadius: '9999px',
              textDecoration: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <span>View All Passenger Requests ({state.passengerRequests?.length || 0})</span>
            <ArrowRight size={15} weight="bold" />
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {(state.passengerRequests || []).slice(0, 3).map((req) => (
            <PassengerRequestCard key={req.id} request={req} />
          ))}
        </div>
      </section>
    </div>
  );
}
