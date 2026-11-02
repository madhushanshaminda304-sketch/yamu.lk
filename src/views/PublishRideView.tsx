import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkle, CheckCircle, Crosshair } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { HUBS, ALL_HUBS, getHubById, findRouteOptions } from '../domain/corridors.ts';
import { calculateRecommendedLkr, getContributionBounds, getPriceBand, stepContributionLkr, type TollPolicy } from '../domain/pricing.ts';
import type { Ride, ApprovalMode, VehicleCategory, LuggageSize } from '../domain/matching.ts';
import { formatLkr, getColomboDateOffset, t } from '../domain/i18n.ts';
import { getCurrentLocation, findNearestHub } from '../native/geolocation.ts';
import { triggerHaptic } from '../native/haptics.ts';
import type { MarketplaceStore, MarketplaceState } from '../state/store.ts';

export function PublishRideView({
  state,
  store,
  openAuthModal,
}: {
  state: MarketplaceState;
  store: MarketplaceStore;
  openAuthModal?: (onSuccess?: () => void) => void;
}) {
  const navigate = useNavigate();
  const tomorrow = getColomboDateOffset(1);
  const dayAfter = getColomboDateOffset(2);

  const [step, setStep] = useState(1);
  const [originHubId, setOriginHubId] = useState('colombo');
  const [destinationHubId, setDestinationHubId] = useState('galle');
  const [pickupLandmark, setPickupLandmark] = useState('');
  const [dropoffLandmark, setDropoffLandmark] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const handleUseLocation = async () => {
    try {
      setIsLocating(true);
      await triggerHaptic('selection');
      const coords = await getCurrentLocation();
      const nearest = findNearestHub(coords, ALL_HUBS);
      setOriginHubId(nearest.hub.id);
      await triggerHaptic('success');
      const langKey = state.locale.slice(0, 2) as 'en' | 'si' | 'ta';
      const hubName = nearest.hub.name[langKey] || nearest.hub.name.en;
      toast.success(`${t(state.locale, 'location.located')}${hubName} (${nearest.distanceKm} km)`);
    } catch {
      toast.error(t(state.locale, 'location.denied'));
    } finally {
      setIsLocating(false);
    }
  };

  // Step 2 Route & Toll Policy
  const routeOptions = findRouteOptions(originHubId, destinationHubId);
  const [selectedCorridorId, setSelectedCorridorId] = useState(routeOptions[0]?.corridorId || '');
  const [selectedStopovers, setSelectedStopovers] = useState<string[]>([]);
  const [boostEnabled, setBoostEnabled] = useState(true);
  const [tollPolicy, setTollPolicy] = useState<TollPolicy>('included');

  // Step 3 Timing & Optional Return Ride
  const [date, setDate] = useState(tomorrow);
  const [departureTime, setDepartureTime] = useState('07:30');
  const [hasReturnRide, setHasReturnRide] = useState(false);
  const [returnDate, setReturnDate] = useState(dayAfter);
  const [returnTime, setReturnTime] = useState('17:00');

  // Step 4 Seats & Vehicle
  const [seats, setSeats] = useState(3);
  const [vehicleModel, setVehicleModel] = useState(state.currentUser?.defaultVehicle || 'Toyota Aqua Hybrid · White');
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory>('car');
  const [quietRide, setQuietRide] = useState(false);
  const [acGuaranteed, setAcGuaranteed] = useState(true);
  const [maxTwoInBack, setMaxTwoInBack] = useState(true);
  const [womenOnly, setWomenOnly] = useState(false);
  const [luggage, setLuggage] = useState<LuggageSize>('medium');
  const [childSeatAvailable, setChildSeatAvailable] = useState(false);
  const [wheelchairAccessible, setWheelchairAccessible] = useState(false);
  const [airportFlightTransfer, setAirportFlightTransfer] = useState(false);

  // Step 5 Pricing
  const activeRoute = routeOptions.find((r) => r.corridorId === selectedCorridorId) || routeOptions[0];
  const recPrice = calculateRecommendedLkr(
    activeRoute?.distanceKm || 100,
    activeRoute?.hasTolls ? tollPolicy : 'no_tolls',
    activeRoute?.estimatedTollLkr
  );
  const bounds = getContributionBounds(recPrice);
  const [priceLkr, setPriceLkr] = useState(recPrice);

  useEffect(() => {
    if (activeRoute) {
      const nextRec = calculateRecommendedLkr(
        activeRoute.distanceKm,
        activeRoute.hasTolls ? tollPolicy : 'no_tolls',
        activeRoute.estimatedTollLkr
      );
      setPriceLkr(nextRec);
    }
  }, [selectedCorridorId, tollPolicy, activeRoute]);

  // Step 6 Approval & Notes
  const [approvalMode, setApprovalMode] = useState<ApprovalMode>('instant');
  const [notes, setNotes] = useState('Expressway tolls included. Please arrive 10 minutes early at the pickup landmark.');
  const [publishedRide, setPublishedRide] = useState<Ride | null>(null);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newRide = store.publishRide({
        originHubId,
        destinationHubId,
        corridorId: selectedCorridorId || activeRoute?.corridorId,
        date,
        departureTime,
        returnTripEnabled: hasReturnRide,
        returnDate: hasReturnRide ? returnDate : undefined,
        returnTime: hasReturnRide ? returnTime : undefined,
        pickupLandmark,
        dropoffLandmark,
        selectedStopoverHubIds: selectedStopovers,
        boostEnabled,
        seats,
        priceLkr,
        tollPolicy: activeRoute?.hasTolls ? tollPolicy : 'no_tolls',
        approvalMode,
        vehicleMakeModel: vehicleModel,
        vehicleCategory,
        acGuaranteed,
        specialRequirements: {
          childSeatAvailable,
          wheelchairAccessible,
          airportFlightTransfer,
        },
        comfort: {
          chattiness: quietRide ? 'bla' : 'blabla',
          quietRide,
          maxTwoInBack,
          luggage,
          music: 'yes',
          pets: 'no',
          smoking: 'no',
          womenOnly,
        },
        luggageCapacity: luggage,
        notes,
      });

      setPublishedRide(newRide);
      toast.success(
        hasReturnRide
          ? 'Outbound and Return rides published successfully!'
          : 'Ride published successfully along corridor!'
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to publish ride.');
    }
  };

  if (!state.currentUser) {
    return (
      <div className="shell-narrow" style={{ padding: '64px 0', textAlign: 'center' }}>
        <div className="auth-icon-badge" style={{ marginBottom: '16px' }}>
          <Sparkle size={28} color="var(--bbc-blue)" weight="fill" />
        </div>
        <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--bbc-navy)' }}>
          Sign In to Publish a Ride
        </h2>
        <p style={{ color: 'var(--bbc-text-secondary)', fontSize: '15px', maxWidth: '480px', margin: '8px auto 28px' }}>
          To ensure passenger trust and road safety, all drivers must verify their Sri Lankan mobile number before offering seats.
        </p>
        <button
          type="button"
          className="btn-primary"
          onClick={() => openAuthModal?.()}
          style={{ padding: '14px 32px', fontSize: '16px' }}
        >
          Verify Mobile & Publish
        </button>
      </div>
    );
  }

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
    <div className="shell-narrow" style={{ padding: '20px 0 88px' }}>
      {/* Wizard Progress Bar */}
      <div
        style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={6}
        aria-label="Publish ride progress"
        aria-valuetext={`Step ${step} of 6`}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: '4px',
              borderRadius: '9999px',
              background: i <= step ? 'var(--yamo-emerald, #047857)' : '#e2e8f0',
              transition: 'background 0.2s ease',
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--bbc-navy)', margin: 0 }}>
          Publish a Ride (Step {step} of 6)
        </h1>
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--yamo-emerald, #047857)', background: '#ecfdf5', padding: '3px 10px', borderRadius: '9999px' }}>
          {['', '1. Where & Landmarks', '2. Route & Toll Policy', '3. Date & Return Ride', '4. Seats & Vehicle', '5. LKR Contribution', '6. Approval & Review'][step]}
        </span>
      </div>

      <div className="publish-wizard-card">
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--bbc-navy)' }}>
              Where are you leaving from and going to?
            </h2>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label htmlFor="publish-origin-select" style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>
                  {t(state.locale, 'search.from')}
                </label>
                <button
                  type="button"
                  onClick={handleUseLocation}
                  disabled={isLocating}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--bbc-blue)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                  title={t(state.locale, 'location.use_my_location')}
                  aria-label={t(state.locale, 'location.use_my_location')}
                >
                  <Crosshair size={14} weight="bold" />
                  <span>{isLocating ? t(state.locale, 'location.locating') : t(state.locale, 'location.use_my_location')}</span>
                </button>
              </div>
              <select
                id="publish-origin-select"
                value={originHubId}
                onChange={(e) => setOriginHubId(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '15px' }}
              >
                {HUBS.map((h) => {
                  const langKey = state.locale.slice(0, 2) as 'en' | 'si' | 'ta';
                  const hubName = h.name[langKey] || h.name.en;
                  return (
                    <option key={h.id} value={h.id}>
                      {hubName} {h.isExpresswayInterchange ? '⚡ (MMC/Exit)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label htmlFor="publish-pickup-landmark" style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Pickup Landmark Meeting Point</label>
              <input
                id="publish-pickup-landmark"
                type="text"
                placeholder="e.g. Fort Railway Station front entrance"
                value={pickupLandmark}
                onChange={(e) => setPickupLandmark(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '15px' }}
              />
            </div>
            <div>
              <label htmlFor="publish-dest-select" style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                {t(state.locale, 'search.to')}
              </label>
              <select
                id="publish-dest-select"
                value={destinationHubId}
                onChange={(e) => setDestinationHubId(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '15px' }}
              >
                {HUBS.filter((h) => h.id !== originHubId).map((h) => {
                  const langKey = state.locale.slice(0, 2) as 'en' | 'si' | 'ta';
                  const hubName = h.name[langKey] || h.name.en;
                  return (
                    <option key={h.id} value={h.id}>
                      {hubName} {h.isExpresswayInterchange ? '⚡ (MMC/Exit)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label htmlFor="publish-dropoff-landmark" style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Drop-off Landmark</label>
              <input
                id="publish-dropoff-landmark"
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
              Choose your Sri Lankan Highway Corridor & Toll Policy
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
                        {opt.hasTolls ? ' · Expressway tolls apply' : ' · Toll-free route'}
                      </div>
                    </div>
                  </div>
                  {opt.hasTolls && <span style={{ fontSize: '12px', fontWeight: 700, color: '#047857', background: '#ecfdf5', padding: '3px 8px', borderRadius: '9999px' }}>Expressway</span>}
                </label>
              ))}
            </div>

            {/* Toll Policy Selector when expressway is selected */}
            {activeRoute?.hasTolls && (
              <div style={{ borderTop: '1px solid var(--bbc-border)', paddingTop: '16px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px', display: 'block' }}>Expressway Toll Policy</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', border: `1px solid ${tollPolicy === 'included' ? 'var(--bbc-blue)' : 'var(--bbc-border)'}`, borderRadius: '8px', cursor: 'pointer', background: tollPolicy === 'included' ? '#f0f9ff' : 'transparent' }}>
                    <input type="radio" name="tollPolicy" checked={tollPolicy === 'included'} onChange={() => setTollPolicy('included')} />
                    <div>
                      <strong style={{ fontSize: '13px' }}>Included in Contribution</strong>
                      <div style={{ fontSize: '11px', color: 'var(--bbc-text-secondary)' }}>Driver covers highway toll ticket</div>
                    </div>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', border: `1px solid ${tollPolicy === 'split_at_gate' ? 'var(--bbc-blue)' : 'var(--bbc-border)'}`, borderRadius: '8px', cursor: 'pointer', background: tollPolicy === 'split_at_gate' ? '#f0f9ff' : 'transparent' }}>
                    <input type="radio" name="tollPolicy" checked={tollPolicy === 'split_at_gate'} onChange={() => setTollPolicy('split_at_gate')} />
                    <div>
                      <strong style={{ fontSize: '13px' }}>Split at Toll Gate</strong>
                      <div style={{ fontSize: '11px', color: 'var(--bbc-text-secondary)' }}>Toll divided by riders onboard</div>
                    </div>
                  </label>
                </div>
              </div>
            )}

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
              <label htmlFor="publish-date-input" style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Outbound Travel Date</label>
              <input
                id="publish-date-input"
                type="date"
                min={getColomboDateOffset(0)}
                value={date}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setDate(newDate);
                  if (returnDate < newDate) {
                    setReturnDate(newDate);
                  }
                }}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '15px' }}
              />
            </div>
            <div>
              <label htmlFor="publish-time-input" style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Departure Time (Colombo Time)</label>
              <input
                id="publish-time-input"
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '15px' }}
              />
            </div>

            {/* Optional Return Journey */}
            <div style={{ borderTop: '1px solid var(--bbc-border)', paddingTop: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer', marginBottom: '12px' }}>
                <input type="checkbox" checked={hasReturnRide} onChange={(e) => setHasReturnRide(e.target.checked)} />
                <strong>{t(state.locale, 'publish.return_trip')}</strong>
              </label>

              {hasReturnRide && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--bbc-surface-subtle)', padding: '16px', borderRadius: '8px' }}>
                  <div>
                    <label htmlFor="return-date-input" style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Return Date</label>
                    <input
                      id="return-date-input"
                      type="date"
                      min={date}
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      style={{ width: '100%', padding: '10px', border: '1px solid var(--bbc-border)', borderRadius: '6px', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label htmlFor="return-time-input" style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Return Time</label>
                    <input
                      id="return-time-input"
                      type="time"
                      value={returnTime}
                      onChange={(e) => setReturnTime(e.target.value)}
                      style={{ width: '100%', padding: '10px', border: '1px solid var(--bbc-border)', borderRadius: '6px', fontSize: '14px' }}
                    />
                  </div>
                </div>
              )}
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
              <span style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Number of Passengers you can take</span>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <button key={n} type="button" onClick={() => setSeats(n)} style={{ width: '44px', height: '44px', borderRadius: '9999px', fontWeight: 800, border: `2px solid ${seats === n ? 'var(--bbc-blue)' : 'var(--bbc-border)'}`, background: seats === n ? 'var(--bbc-blue)' : '#ffffff', color: seats === n ? '#ffffff' : 'var(--bbc-navy)' }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Vehicle Class</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {[
                  { id: 'car', label: 'Car / Sedan', icon: '🚗' },
                  { id: 'suv', label: 'Comfort SUV', icon: '🚙' },
                  { id: 'van', label: 'Spacious Van', icon: '🚐' },
                ].map((tier) => (
                  <button key={tier.id} type="button" onClick={() => setVehicleCategory(tier.id as VehicleCategory)} style={{ padding: '8px 4px', borderRadius: '8px', border: `2px solid ${vehicleCategory === tier.id ? 'var(--bbc-blue)' : 'var(--bbc-border)'}`, background: vehicleCategory === tier.id ? '#f0f9ff' : '#ffffff', cursor: 'pointer', textAlign: 'center' }}>
                    <span style={{ fontSize: '16px', display: 'block' }}>{tier.icon}</span>
                    <strong style={{ fontSize: '11px', display: 'block', color: 'var(--bbc-navy)' }}>{tier.label}</strong>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="publish-vehicle-model" style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Vehicle Make & Model</label>
              <input
                id="publish-vehicle-model"
                type="text"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="e.g. Toyota Aqua · Silver"
                style={{ width: '100%', padding: '12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '15px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
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
              <label className="filter-option" style={{ padding: '10px', border: '1px solid var(--bbc-border)', borderRadius: '8px' }}>
                <input type="checkbox" checked={quietRide} onChange={(e) => setQuietRide(e.target.checked)} />
                <span>🔇 Quiet Commute</span>
              </label>
              <label className="filter-option" style={{ padding: '10px', border: '1px solid var(--bbc-border)', borderRadius: '8px' }}>
                <input type="checkbox" checked={childSeatAvailable} onChange={(e) => setChildSeatAvailable(e.target.checked)} />
                <span>💺 Child Safety Seat</span>
              </label>
              <label className="filter-option" style={{ padding: '10px', border: '1px solid var(--bbc-border)', borderRadius: '8px' }}>
                <input type="checkbox" checked={wheelchairAccessible} onChange={(e) => setWheelchairAccessible(e.target.checked)} />
                <span>♿ Wheelchair / Assist</span>
              </label>
              <label className="filter-option" style={{ padding: '10px', border: '1px solid var(--bbc-border)', borderRadius: '8px' }}>
                <input type="checkbox" checked={airportFlightTransfer} onChange={(e) => setAirportFlightTransfer(e.target.checked)} />
                <span>✈️ Airport Terminal Drop</span>
              </label>
            </div>

            <div>
              <span style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '8px', color: 'var(--bbc-navy)' }}>
                {t(state.locale, 'luggage.title')}
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {[
                  { key: 'small', label: t(state.locale, 'luggage.backpack'), icon: '🎒', desc: 'No boot space' },
                  { key: 'medium', label: t(state.locale, 'luggage.medium'), icon: '🧳', desc: 'Standard suitcase' },
                  { key: 'large', label: t(state.locale, 'luggage.large'), icon: '✈️', desc: 'Airport / surf' },
                ].map((opt) => {
                  const isSelected = luggage === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setLuggage(opt.key as LuggageSize)}
                      style={{
                        padding: '12px 8px',
                        borderRadius: '8px',
                        border: `2px solid ${isSelected ? 'var(--bbc-blue)' : 'var(--bbc-border)'}`,
                        background: isSelected ? '#f0f9ff' : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: '20px', display: 'block', marginBottom: '2px' }}>{opt.icon}</span>
                      <strong style={{ fontSize: '12px', display: 'block', color: 'var(--bbc-navy)' }}>{opt.label}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--bbc-text-secondary)' }}>{opt.desc}</span>
                    </button>
                  );
                })}
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
              Yamo is a cost-sharing platform, not a commercial taxi. We recommend a fair rate based on distance (~LKR 20/km) and highway tolls to prevent unlawful commercial profiting.
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
                    aria-label="Decrease price"
                  >
                    –
                  </button>
                  <span className="stepper-val">{formatLkr(priceLkr)}</span>
                  <button
                    type="button"
                    className="stepper-btn"
                    disabled={priceLkr >= bounds.maxLkr}
                    onClick={() => setPriceLkr(stepContributionLkr(priceLkr, 1, bounds))}
                    aria-label="Increase price"
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
              <span style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                Can passengers book instantly?
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ padding: '14px', border: `2px solid ${approvalMode === 'instant' ? 'var(--bbc-blue)' : 'var(--bbc-border)'}`, borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: approvalMode === 'instant' ? '#f0f9ff' : 'transparent' }}>
                  <input type="radio" name="approval" checked={approvalMode === 'instant'} onChange={() => setApprovalMode('instant')} />
                  <div style={{ marginTop: '6px' }}>
                    <strong style={{ color: 'var(--bbc-navy)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sparkle size={16} weight="fill" color="var(--bbc-blue)" /> Instant Booking
                    </strong>
                    <p style={{ fontSize: '12px', color: 'var(--bbc-text-secondary)', marginTop: '2px' }}>Passengers book instantly.</p>
                  </div>
                </label>

                <label style={{ padding: '14px', border: `2px solid ${approvalMode === 'manual' ? 'var(--bbc-blue)' : 'var(--bbc-border)'}`, borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: approvalMode === 'manual' ? '#f0f9ff' : 'transparent' }}>
                  <input type="radio" name="approval" checked={approvalMode === 'manual'} onChange={() => setApprovalMode('manual')} />
                  <div style={{ marginTop: '6px' }}>
                    <strong style={{ color: 'var(--bbc-navy)' }}>Manual Request</strong>
                    <p style={{ fontSize: '12px', color: 'var(--bbc-text-secondary)', marginTop: '2px' }}>Review each request before accepting.</p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="publish-notes-textarea" style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Notes for Passengers
              </label>
              <textarea
                id="publish-notes-textarea"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ background: '#f4f6f8', padding: '16px', borderRadius: '8px', fontSize: '13px', color: 'var(--bbc-text-secondary)' }}>
              <strong>Summary:</strong> {getHubById(originHubId)?.name.en} → {getHubById(destinationHubId)?.name.en} on {date} at {departureTime} · {seats} seats at {formatLkr(priceLkr)} per seat ({approvalMode === 'instant' ? 'Instant Booking' : 'Manual Request'}).
              {hasReturnRide && ` · Includes return ride on ${returnDate} at ${returnTime}.`}
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
