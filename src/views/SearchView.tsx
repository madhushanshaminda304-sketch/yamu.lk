import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  ArrowsLeftRight,
  Crosshair,
  Bell,
  Sparkle,
  Star,
  UserCheck,
  Wind,
  X,
  FadersHorizontal,
  Clock,
  Users,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { HUBS, ALL_HUBS, getHubById } from '../domain/corridors.ts';
import { searchRides, type MatchedRideResult, type VehicleCategory } from '../domain/matching.ts';
import { t, formatColomboDate, getColomboDateOffset } from '../domain/i18n.ts';
import { getCurrentLocation, findNearestHub } from '../native/geolocation.ts';
import { triggerHaptic } from '../native/haptics.ts';
import { pushOverlayDismissHandler } from '../native/backButton.ts';
import type { MarketplaceStore, MarketplaceState } from '../state/store.ts';
import { RideCardItem } from '../components/RideCardItem.tsx';
import { SearchFilterControls } from '../components/SearchFilterControls.tsx';
import { LeafletRouteMap } from '../components/LeafletRouteMap.tsx';
import { extractRouteMapWaypoints, buildHubPairWaypoints } from '../domain/routeMapGeometry.ts';

export function SearchView({
  state,
  store,
}: {
  state: MarketplaceState;
  store: MarketplaceStore;
}) {
  const [params, setSearchParams] = useSearchParams();
  const locale = state.locale;

  const fromHubId = params.get('from') || 'colombo';
  const toHubId = params.get('to') || 'galle';
  const date = params.get('date') || getColomboDateOffset(1);
  const seats = Number(params.get('seats') || '1');
  const [isLocating, setIsLocating] = useState(false);

  const updateRoute = (newFrom: string, newTo: string) => {
    const nextParams = new URLSearchParams(params);
    nextParams.set('from', newFrom);
    nextParams.set('to', newTo);
    setSearchParams(nextParams);
  };

  const handleUseLocation = async () => {
    try {
      setIsLocating(true);
      await triggerHaptic('selection');
      const coords = await getCurrentLocation();
      const nearest = findNearestHub(coords, ALL_HUBS);
      updateRoute(nearest.hub.id, toHubId);
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

  // Filter States
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory | 'all'>('all');
  const [quietRideOnly, setQuietRideOnly] = useState(false);
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
  const [childSeatOnly, setChildSeatOnly] = useState(false);
  const [wheelchairOnly, setWheelchairOnly] = useState(false);
  const [airportOnly, setAirportOnly] = useState(false);

  // Ride Alert Modal
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertEmail, setAlertEmail] = useState(state.currentUser?.email || '');

  // Mobile Bottom Sheet Filter Drawer
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showSearchMap, setShowSearchMap] = useState(true);

  // Hardware Back Button & Scroll Lock for Drawer
  useEffect(() => {
    if (!showFilterDrawer) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const unregisterBack = pushOverlayDismissHandler(() => {
      setShowFilterDrawer(false);
      return true;
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowFilterDrawer(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      unregisterBack();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showFilterDrawer]);

  // Hardware Back Button & Scroll Lock for Alert Modal
  useEffect(() => {
    if (!showAlertModal) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const unregisterBack = pushOverlayDismissHandler(() => {
      setShowAlertModal(false);
      return true;
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAlertModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      unregisterBack();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showAlertModal]);

  const activeFilterCount =
    (vehicleCategory !== 'all' ? 1 : 0) +
    (quietRideOnly ? 1 : 0) +
    (sortBy !== 'departure' ? 1 : 0) +
    (timeWindow !== 'all' ? 1 : 0) +
    (maxPrice < 10000 ? 1 : 0) +
    (instantOnly ? 1 : 0) +
    (superDriverOnly ? 1 : 0) +
    (verifiedOnly ? 1 : 0) +
    (maxTwoInBackOnly ? 1 : 0) +
    (womenOnly ? 1 : 0) +
    (acOnly ? 1 : 0) +
    (petsAllowedOnly ? 1 : 0) +
    (childSeatOnly ? 1 : 0) +
    (wheelchairOnly ? 1 : 0) +
    (airportOnly ? 1 : 0);

  const handleResetFilters = () => {
    triggerHaptic('selection');
    setVehicleCategory('all');
    setQuietRideOnly(false);
    setSortBy('departure');
    setTimeWindow('all');
    setMaxPrice(10000);
    setInstantOnly(false);
    setSuperDriverOnly(false);
    setVerifiedOnly(false);
    setMaxTwoInBackOnly(false);
    setWomenOnly(false);
    setAcOnly(false);
    setPetsAllowedOnly(false);
    setChildSeatOnly(false);
    setWheelchairOnly(false);
    setAirportOnly(false);
  };

  const fromHub = getHubById(fromHubId);
  const toHub = getHubById(toHubId);

  const results: MatchedRideResult[] = searchRides(state.rides, {
    fromHubId,
    toHubId,
    date,
    seats,
    vehicleCategory,
    quietRideOnly,
    childSeatOnly,
    wheelchairOnly,
    airportOnly,
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
      <div style={{ padding: '16px 0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--bbc-border)', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ minWidth: 0, flex: '1 1 240px' }}>
          <h1 style={{ fontSize: 'clamp(20px, 5.5vw, 26px)', fontWeight: 800, color: 'var(--bbc-navy)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', lineHeight: 1.25 }}>
            <span>{fromHub?.name[locale.slice(0, 2) as 'en' | 'si' | 'ta'] || fromHub?.name.en || fromHubId}</span>
            <ArrowRight size={20} color="var(--yamo-emerald)" />
            <span>{toHub?.name[locale.slice(0, 2) as 'en' | 'si' | 'ta'] || toHub?.name.en || toHubId}</span>
          </h1>
          <p style={{ color: 'var(--bbc-text-secondary)', fontSize: '13.5px', marginTop: '4px' }}>
            {formatColomboDate(`${date}T12:00:00+05:30`)} · {seats} {seats === 1 ? 'Passenger' : 'Passengers'} · <strong style={{ color: 'var(--yamo-emerald)' }}>{results.length} rides available</strong>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={() => setShowSearchMap((prev) => !prev)}
            style={{ borderRadius: '9999px', padding: '8px 14px', fontSize: '13px', fontWeight: 700, color: '#047857', borderColor: '#a7f3d0', background: showSearchMap ? '#ecfdf5' : '#ffffff' }}
          >
            <span>{showSearchMap ? '🗺️ Hide Route Map' : '🗺️ Show Route Map'}</span>
          </button>
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={() => setShowAlertModal(true)}
            aria-label="Create a Ride Alert"
            style={{ borderRadius: '9999px', padding: '8px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Bell size={16} />
            <span>{t(locale, 'alert.cta')}</span>
          </button>
        </div>
      </div>

      {/* Origin & Destination Bar with 1-Tap Geolocation */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--bbc-border)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        margin: '14px 0 16px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '10px',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
            <label htmlFor="search-from-select" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--bbc-text-secondary)', textTransform: 'uppercase' }}>
              {t(locale, 'search.from')}
            </label>
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
                padding: '2px 8px',
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
          <select
            id="search-from-select"
            value={fromHubId}
            onChange={(e) => updateRoute(e.target.value, toHubId)}
            style={{ padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--bbc-border)', fontSize: '14px', fontWeight: 600, color: 'var(--bbc-navy)', background: '#fff', minHeight: '44px' }}
          >
            {HUBS.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name[locale.slice(0, 2) as 'en' | 'si' | 'ta'] || h.name.en} {h.isExpresswayInterchange ? '⚡ (MMC/Exit)' : ''}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => updateRoute(toHubId, fromHubId)}
          className="swap-btn"
          aria-label="Swap Route"
          style={{ alignSelf: 'flex-end', marginBottom: '4px' }}
        >
          <ArrowsLeftRight size={18} weight="bold" />
        </button>

        <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="search-to-select" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--bbc-text-secondary)', textTransform: 'uppercase' }}>
            {t(locale, 'search.to')}
          </label>
          <select
            id="search-to-select"
            value={toHubId}
            onChange={(e) => updateRoute(fromHubId, e.target.value)}
            style={{ padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--bbc-border)', fontSize: '14px', fontWeight: 600, color: 'var(--bbc-navy)', background: '#fff', minHeight: '44px' }}
          >
            {HUBS.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name[locale.slice(0, 2) as 'en' | 'si' | 'ta'] || h.name.en} {h.isExpresswayInterchange ? '⚡ (MMC/Exit)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vehicle Tier Selector (Yandex-Style Tariffs) */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px 0 14px', scrollbarWidth: 'none' }}>
        {[
          { id: 'all', label: 'All Vehicles', icon: '🚘' },
          { id: 'car', label: 'Standard Saver', icon: '🚗' },
          { id: 'suv', label: 'Comfort SUV', icon: '🚙' },
          { id: 'van', label: 'Spacious Van', icon: '🚐' },
        ].map((tier) => {
          const isActive = vehicleCategory === tier.id;
          return (
            <button
              key={tier.id}
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setVehicleCategory(tier.id as VehicleCategory | 'all');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 700,
                border: isActive ? '1px solid #047857' : '1px solid var(--bbc-border)',
                background: isActive ? '#ecfdf5' : '#ffffff',
                color: isActive ? '#047857' : 'var(--bbc-navy)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? '0 1px 3px rgba(4, 120, 87, 0.15)' : 'none',
              }}
            >
              <span>{tier.icon}</span>
              <span>{tier.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile Quick Filter Strip */}
      <div className="mobile-quick-filter-strip md:hidden" role="toolbar" aria-label="Quick Filters">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setShowFilterDrawer(true);
          }}
          className={`quick-filter-btn ${activeFilterCount > 0 ? 'active' : ''}`}
          aria-label="Open Filter Options"
        >
          <FadersHorizontal size={18} weight="bold" />
          <span>Filters</span>
          {activeFilterCount > 0 && <span className="quick-filter-badge">{activeFilterCount}</span>}
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setSortBy(sortBy === 'price' ? 'departure' : 'price');
          }}
          className={`quick-filter-btn ${sortBy === 'price' ? 'active' : ''}`}
        >
          <Star size={16} weight={sortBy === 'price' ? 'fill' : 'regular'} />
          <span>{t(locale, 'tag.cheapest')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setSortBy('departure');
          }}
          className={`quick-filter-btn ${sortBy === 'departure' ? 'active' : ''}`}
        >
          <Clock size={16} weight={sortBy === 'departure' ? 'bold' : 'regular'} />
          <span>{t(locale, 'tag.earliest')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setInstantOnly(!instantOnly);
          }}
          className={`quick-filter-btn ${instantOnly ? 'active' : ''}`}
        >
          <Sparkle size={16} weight={instantOnly ? 'fill' : 'regular'} />
          <span>{t(locale, 'filter.instant')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setVerifiedOnly(!verifiedOnly);
          }}
          className={`quick-filter-btn ${verifiedOnly ? 'active' : ''}`}
        >
          <UserCheck size={16} weight={verifiedOnly ? 'bold' : 'regular'} />
          <span>{t(locale, 'filter.verified')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setAcOnly(!acOnly);
          }}
          className={`quick-filter-btn ${acOnly ? 'active' : ''}`}
        >
          <Wind size={16} weight={acOnly ? 'bold' : 'regular'} />
          <span>{t(locale, 'filter.ac')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setMaxTwoInBackOnly(!maxTwoInBackOnly);
          }}
          className={`quick-filter-btn ${maxTwoInBackOnly ? 'active' : ''}`}
        >
          <Users size={16} weight={maxTwoInBackOnly ? 'bold' : 'regular'} />
          <span>{t(locale, 'filter.max_two_back')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setQuietRideOnly(!quietRideOnly);
          }}
          className={`quick-filter-btn ${quietRideOnly ? 'active' : ''}`}
        >
          <span>🔇</span>
          <span>Quiet Commute</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setChildSeatOnly(!childSeatOnly);
          }}
          className={`quick-filter-btn ${childSeatOnly ? 'active' : ''}`}
        >
          <span>💺</span>
          <span>Child Seat</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setWheelchairOnly(!wheelchairOnly);
          }}
          className={`quick-filter-btn ${wheelchairOnly ? 'active' : ''}`}
        >
          <span>♿</span>
          <span>Wheelchair</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setAirportOnly(!airportOnly);
          }}
          className={`quick-filter-btn ${airportOnly ? 'active' : ''}`}
        >
          <span>✈️</span>
          <span>Airport</span>
        </button>
      </div>

      <div className="search-layout">
        {/* Sidebar Filters - Desktop Only */}
        <aside className="filters-sidebar hidden md:block">
          <SearchFilterControls
            sortBy={sortBy}
            setSortBy={setSortBy}
            timeWindow={timeWindow}
            setTimeWindow={setTimeWindow}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
            instantOnly={instantOnly}
            setInstantOnly={setInstantOnly}
            superDriverOnly={superDriverOnly}
            setSuperDriverOnly={setSuperDriverOnly}
            verifiedOnly={verifiedOnly}
            setVerifiedOnly={setVerifiedOnly}
            maxTwoInBackOnly={maxTwoInBackOnly}
            setMaxTwoInBackOnly={setMaxTwoInBackOnly}
            womenOnly={womenOnly}
            setWomenOnly={setWomenOnly}
            acOnly={acOnly}
            setAcOnly={setAcOnly}
            petsAllowedOnly={petsAllowedOnly}
            setPetsAllowedOnly={setPetsAllowedOnly}
            vehicleCategory={vehicleCategory}
            setVehicleCategory={setVehicleCategory}
            quietRideOnly={quietRideOnly}
            setQuietRideOnly={setQuietRideOnly}
            childSeatOnly={childSeatOnly}
            setChildSeatOnly={setChildSeatOnly}
            wheelchairOnly={wheelchairOnly}
            setWheelchairOnly={setWheelchairOnly}
            airportOnly={airportOnly}
            setAirportOnly={setAirportOnly}
            locale={locale}
            namePrefix="desktop"
          />
        </aside>

        {/* Results List */}
        <main className="results-container">
          {showSearchMap && fromHub && toHub && (
            <div style={{ marginBottom: '16px' }}>
              <LeafletRouteMap
                waypoints={
                  results[0]
                    ? extractRouteMapWaypoints(results[0].ride.stops, fromHubId, toHubId, locale.slice(0, 2) as 'en' | 'si' | 'ta')
                    : buildHubPairWaypoints(fromHubId, toHubId, locale.slice(0, 2) as 'en' | 'si' | 'ta')
                }
                height={235}
                enableLiveTracking={false}
              />
            </div>
          )}
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

      {/* Mobile Slide-Up Bottom Sheet Filter Drawer */}
      {showFilterDrawer && (
        <div
          className="bottom-sheet-backdrop md:hidden"
          onClick={() => setShowFilterDrawer(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Filter Rides"
        >
          <div
            className="bottom-sheet-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bottom-sheet-handle" />

            <div className="bottom-sheet-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--bbc-navy)', margin: 0 }}>
                  Filter Rides
                </h3>
                {activeFilterCount > 0 && (
                  <span className="quick-filter-badge">{activeFilterCount}</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    style={{ fontSize: '13px', fontWeight: 700, color: 'var(--yamo-emerald, #047857)', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
                  >
                    Reset All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowFilterDrawer(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '44px',
                    minWidth: '44px',
                    height: '44px',
                    minHeight: '44px',
                    borderRadius: '50%',
                    background: '#f1f5f9',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--bbc-navy)',
                  }}
                  aria-label="Close filters"
                >
                  <X size={20} weight="bold" />
                </button>
              </div>
            </div>

            <div className="bottom-sheet-body">
              <SearchFilterControls
                sortBy={sortBy}
                setSortBy={setSortBy}
                timeWindow={timeWindow}
                setTimeWindow={setTimeWindow}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                instantOnly={instantOnly}
                setInstantOnly={setInstantOnly}
                superDriverOnly={superDriverOnly}
                setSuperDriverOnly={setSuperDriverOnly}
                verifiedOnly={verifiedOnly}
                setVerifiedOnly={setVerifiedOnly}
                maxTwoInBackOnly={maxTwoInBackOnly}
                setMaxTwoInBackOnly={setMaxTwoInBackOnly}
                womenOnly={womenOnly}
                setWomenOnly={setWomenOnly}
                acOnly={acOnly}
                setAcOnly={setAcOnly}
                petsAllowedOnly={petsAllowedOnly}
                setPetsAllowedOnly={setPetsAllowedOnly}
                vehicleCategory={vehicleCategory}
                setVehicleCategory={setVehicleCategory}
                quietRideOnly={quietRideOnly}
                setQuietRideOnly={setQuietRideOnly}
                childSeatOnly={childSeatOnly}
                setChildSeatOnly={setChildSeatOnly}
                wheelchairOnly={wheelchairOnly}
                setWheelchairOnly={setWheelchairOnly}
                airportOnly={airportOnly}
                setAirportOnly={setAirportOnly}
                locale={locale}
                namePrefix="drawer"
              />
            </div>

            <div className="bottom-sheet-footer">
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  triggerHaptic('success');
                  setShowFilterDrawer(false);
                }}
                style={{ width: '100%', minHeight: '48px', fontSize: '16px' }}
              >
                View {results.length} {results.length === 1 ? 'Ride' : 'Rides'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ride Alert Modal */}
      {showAlertModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 71, 82, 0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', padding: '28px', maxWidth: '440px', width: '100%', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--bbc-navy)', margin: 0 }}>
                Create a Ride Alert
              </h3>
              <button
                type="button"
                onClick={() => setShowAlertModal(false)}
                aria-label="Close dialog"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '44px',
                  minWidth: '44px',
                  height: '44px',
                  minHeight: '44px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--bbc-navy)',
                }}
              >
                <X size={20} />
              </button>
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
                <button type="button" className="btn-secondary btn-sm" onClick={() => setShowAlertModal(false)} style={{ minHeight: '44px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary btn-sm" style={{ minHeight: '44px' }}>
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
