import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Star,
  CheckCircle,
  Sparkle,
  Ticket,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { RidePassModal } from '../components/RidePassModal.tsx';
import { RouteCorridorMap } from '../components/RouteCorridorMap.tsx';
import { CarPlateBadge } from '../components/CarPlateBadge.tsx';
import { CompareAlternativesModal } from '../components/CompareAlternativesModal.tsx';
import { getHubById } from '../domain/corridors.ts';
import { canBookLeg } from '../domain/matching.ts';
import { normalizeSriLankanMobile } from '../domain/auth.ts';
import { formatLkr, formatColomboDate, formatColomboTime, t } from '../domain/i18n.ts';
import type { MarketplaceStore, MarketplaceState, SettlementMethod, BookingRecord } from '../state/store.ts';
import { getDriverInitials } from '../components/RideCardItem.tsx';

export function RideDetailView({
  state,
  store,
  openAuthModal,
}: {
  state: MarketplaceState;
  store: MarketplaceStore;
  openAuthModal?: (onSuccess?: () => void) => void;
}) {
  const { id: routeRideId } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const ride = state.rides.find((r) => r.id === routeRideId);
  const fromHubId = params.get('from') || ride?.originHubId || '';
  const toHubId = params.get('to') || ride?.destinationHubId || '';

  const [seats, setSeats] = useState(1);
  const [settlementMethod, setSettlementMethod] = useState<SettlementMethod>('lankaqr');
  const [message, setMessage] = useState('');
  const [isBookingForOther, setIsBookingForOther] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState<BookingRecord | null>(null);
  const [showRidePass, setShowRidePass] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);

  if (!ride) {
    return (
      <div className="shell" style={{ padding: '64px 0', textAlign: 'center' }}>
        <h2>Ride not found</h2>
        <Link to="/search" className="btn-primary" style={{ marginTop: '16px' }}>Back to Search</Link>
      </div>
    );
  }

  const langKey = state.locale.slice(0, 2) as 'en' | 'si' | 'ta';
  const fromHub = getHubById(fromHubId);
  const toHub = getHubById(toHubId);
  const fromName = fromHub?.name[langKey] || fromHub?.name.en || fromHubId;
  const toName = toHub?.name[langKey] || toHub?.name.en || toHubId;

  const legCheck = canBookLeg(ride, fromHubId, toHubId, seats);
  const fromStop = legCheck.fromStop || ride.stops[0];
  const toStop = legCheck.toStop || ride.stops[ride.stops.length - 1];

  const executeBooking = () => {
    try {
      let cleanGuestPhone: string | undefined = undefined;
      if (isBookingForOther) {
        if (!guestName.trim()) {
          toast.error('Please enter the passenger’s name.');
          return;
        }
        if (guestPhone.trim()) {
          const norm = normalizeSriLankanMobile(guestPhone);
          if (!norm.valid || !norm.phone) {
            toast.error(norm.error || 'Please enter a valid Sri Lankan mobile number (+947XXXXXXXX).');
            return;
          }
          cleanGuestPhone = norm.phone;
        }
      }
      const record = store.bookRideLeg({
        rideId: ride.id,
        fromHubId,
        toHubId,
        seats,
        settlementMethod,
        message,
        isBookingForOther,
        guestPassengerName: isBookingForOther ? guestName.trim() : undefined,
        guestPassengerPhone: cleanGuestPhone,
      });
      setBookingConfirmed(record);
      if (record.status === 'accepted') {
        toast.success(`Booking Confirmed! ${seats} seat(s) reserved with ${ride.driver.name}.`);
      } else {
        toast.info(`Request sent to ${ride.driver.name}. You will be notified upon confirmation.`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Booking failed.';
      toast.error(errorMsg);
    }
  };

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.currentUser) {
      openAuthModal?.(() => {
        executeBooking();
      });
      return;
    }
    executeBooking();
  };

  return (
    <div className="shell" style={{ padding: '32px 0 80px' }}>
      <Link to={`/search?from=${fromHubId}&to=${toHubId}&date=${ride.departureDate}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--bbc-blue)', fontWeight: 700, marginBottom: '24px' }}>
        ← Back to search results
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '36px' }}>
        {/* Left: Journey Itinerary & Driver */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <RouteCorridorMap
            ride={ride}
            selectedFromHubId={fromHubId}
            selectedToHubId={toHubId}
            langKey={langKey}
            currentUserId={state.currentUser?.id || 'guest-rider'}
            currentUserName={state.currentUser?.name || 'Passenger'}
            userRole={state.currentUser?.id === ride.driverId ? 'driver' : 'passenger'}
            enableLiveTracking={true}
          />

          <div style={{ background: '#ffffff', border: '1px solid var(--bbc-border)', borderRadius: 'var(--radius-md)', padding: '28px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bbc-text-secondary)', textTransform: 'uppercase' }}>
                  {formatColomboDate(ride.departureAt)}
                </span>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--bbc-navy)', marginTop: '4px' }}>
                  {fromName} → {toName}
                </h1>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {ride.journeyStatus === 'departed' && (
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#047857', background: '#d1fae5', padding: '4px 12px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    🟢 Driver En Route
                  </span>
                )}
                {ride.hasTolls && (
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#047857', background: '#ecfdf5', padding: '4px 12px', borderRadius: '9999px' }}>
                    {ride.corridorCode} Tolls Included
                  </span>
                )}
              </div>
            </div>

            {/* Stopover Itinerary Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', paddingLeft: '8px' }}>
              {ride.stops.map((stop) => {
                const isSelectedFrom = stop.hubId === fromHubId;
                const isSelectedTo = stop.hubId === toHubId;
                const isBoarding = stop.stopIndex >= (legCheck.fromIndex ?? 0) && stop.stopIndex <= (legCheck.toIndex ?? ride.stops.length - 1);
                const stopHub = getHubById(stop.hubId);
                const stopName = stopHub?.name[langKey] || stopHub?.name.en || stop.hubId;

                return (
                  <div key={stop.hubId} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{ width: '60px', fontSize: '16px', fontWeight: 800, color: isBoarding ? 'var(--bbc-navy)' : 'var(--bbc-text-muted)' }}>
                      {formatColomboTime(stop.departureAt)}
                    </div>
                    <div style={{ width: '16px', height: '16px', borderRadius: '9999px', background: isSelectedFrom || isSelectedTo ? 'var(--bbc-blue)' : isBoarding ? '#047857' : '#c2cbd0', border: '3px solid #ffffff', boxShadow: 'var(--shadow-sm)', marginTop: '4px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: isBoarding ? 'var(--bbc-navy)' : 'var(--bbc-text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{stopName}</span>
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
                {getDriverInitials(ride.driver.name)}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--bbc-navy)' }}>
                Vehicle & Comfort Rules
              </h3>
              <CarPlateBadge
                plate={ride.vehicle.plateHint || ride.vehicle.plateNumber || 'WP CAB-••••'}
                isMasked={!bookingConfirmed}
                size="md"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', fontSize: '14px' }}>
              <div><strong>Category:</strong> {(ride.vehicleCategory || ride.vehicle.category) === 'suv' ? 'Comfort SUV' : (ride.vehicleCategory || ride.vehicle.category) === 'van' ? 'Spacious Van' : 'Standard Car'}</div>
              <div><strong>Car:</strong> {ride.vehicle.makeModel}</div>
              <div><strong>Quiet Commute:</strong> {ride.comfort?.quietRide ? '🔇 Quiet / Work Friendly' : 'Normal / Friendly'}</div>
              <div><strong>AC:</strong> {ride.vehicle.acGuaranteed ? 'Guaranteed AC' : 'Standard Ventilation'}</div>
              <div><strong>Backseat:</strong> {ride.comfort.maxTwoInBack ? 'Max 2 in the back (Spacious)' : 'Standard 3 in back'}</div>
              <div><strong>Chattiness:</strong> {ride.comfort.chattiness === 'bla' ? 'Quiet type' : ride.comfort.chattiness === 'blabla' ? 'Chatty based on mood' : 'Loves to chat!'}</div>
              <div><strong>Luggage:</strong> {(ride.luggageCapacity ?? ride.comfort?.luggage ?? 'medium').toUpperCase()} bag allowed</div>
              <div><strong>Women Only:</strong> {ride.comfort.womenOnly ? 'Yes (Ladies Only)' : 'All travellers welcome'}</div>
              <div><strong>Music:</strong> {ride.comfort.music === 'yes' ? 'Playlist on' : 'Quiet cabin'}</div>
              <div><strong>Smoking:</strong> {ride.comfort.smoking === 'yes' ? 'Allowed' : 'Strictly No smoking'}</div>
            </div>

            {/* Special Trip Features */}
            {(ride.specialRequirements?.childSeatAvailable ||
              ride.specialRequirements?.wheelchairAccessible ||
              ride.specialRequirements?.airportFlightTransfer) && (
              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--bbc-border)', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {ride.specialRequirements.childSeatAvailable && (
                  <span style={{ fontSize: '12px', background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '9999px', fontWeight: 600 }}>
                    💺 Child Safety Seat Available
                  </span>
                )}
                {ride.specialRequirements.wheelchairAccessible && (
                  <span style={{ fontSize: '12px', background: '#dbeafe', color: '#1d4ed8', padding: '4px 10px', borderRadius: '9999px', fontWeight: 600 }}>
                    ♿ Wheelchair / Assist Friendly
                  </span>
                )}
                {ride.specialRequirements.airportFlightTransfer && (
                  <span style={{ fontSize: '12px', background: '#ecfdf5', color: '#047857', padding: '4px 10px', borderRadius: '9999px', fontWeight: 600 }}>
                    ✈️ Airport Flight Drop Friendly
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Booking Box */}
        <div>
          <div style={{ background: '#ffffff', border: '1px solid var(--bbc-border)', borderRadius: 'var(--radius-md)', padding: '28px', boxShadow: 'var(--shadow-md)', position: 'sticky', top: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '13px', color: 'var(--bbc-text-secondary)', fontWeight: 700 }}>
                  {t(state.locale, 'booking.total_cost')}
                </span>
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
                <div style={{ marginTop: '18px', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button type="button" className="btn-primary btn-sm" onClick={() => setShowRidePass(true)} style={{ background: '#0284c7' }}>
                    <Ticket size={16} weight="bold" />
                    <span>{t(state.locale, 'ridepass.title')}</span>
                  </button>
                  <button type="button" className="btn-secondary btn-sm" onClick={() => navigate('/rides')}>
                    View in Your Rides
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label htmlFor="seats-select" style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    {t(state.locale, 'booking.seats_needed')}
                  </label>
                  <select
                    id="seats-select"
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
                  <span style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Onboard Settlement Method</span>
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
                  <label htmlFor="booking-note-textarea" style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Note to Driver <span style={{ color: 'var(--bbc-text-secondary)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <textarea
                    id="booking-note-textarea"
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. I’ll be at the main entrance with one small bag."
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ padding: '14px', background: '#f8fafc', border: '1px solid var(--bbc-border)', borderRadius: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'var(--bbc-navy)' }}>
                    <input
                      type="checkbox"
                      checked={isBookingForOther}
                      onChange={(e) => setIsBookingForOther(e.target.checked)}
                    />
                    <span>Book for someone else (family / friend)</span>
                  </label>
                  {isBookingForOther && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--bbc-navy)' }}>
                          Passenger Full Name *
                        </label>
                        <input
                          type="text"
                          required={isBookingForOther}
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="e.g. Kamala Perera"
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--bbc-border)', borderRadius: '6px', fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--bbc-navy)' }}>
                          Passenger Phone (+94)
                        </label>
                        <input
                          type="tel"
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder="+947XXXXXXXX"
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--bbc-border)', borderRadius: '6px', fontSize: '13px' }}
                        />
                      </div>
                    </div>
                  )}
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
                      <span>{t(state.locale, 'booking.instant')} ({formatLkr(legCheck.legPriceLkr * seats)})</span>
                    </>
                  ) : (
                    <span>{t(state.locale, 'booking.manual')}</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowCompareModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    background: '#ecfdf5',
                    color: '#047857',
                    border: '1px solid #a7f3d0',
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>📊 Compare vs Highway Bus & Solo Taxi</span>
                </button>

                <p style={{ fontSize: '12px', color: 'var(--bbc-text-secondary)', textAlign: 'center', lineHeight: 1.4 }}>
                  No online payment is taken. Pay your driver onboard via {settlementMethod === 'lankaqr' ? 'LankaQR' : 'Cash (LKR)'}.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      {bookingConfirmed && (
        <RidePassModal
          isOpen={showRidePass}
          onClose={() => setShowRidePass(false)}
          ride={ride}
          booking={bookingConfirmed}
          driver={state.currentUser?.id === ride.driverId ? state.currentUser : undefined}
          locale={state.locale}
        />
      )}

      <CompareAlternativesModal
        isOpen={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        fromName={fromName}
        toName={toName}
        yamoPriceLkr={legCheck.legPriceLkr}
        corridorCode={ride.corridorCode}
        hasTolls={ride.hasTolls}
      />
    </div>
  );
}
