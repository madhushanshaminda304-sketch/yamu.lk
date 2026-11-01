import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Star,
  CheckCircle,
  Sparkle,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { getHubById } from '../domain/corridors.ts';
import { canBookLeg } from '../domain/matching.ts';
import { formatLkr, formatColomboDate, formatColomboTime } from '../domain/i18n.ts';
import type { MarketplaceStore, MarketplaceState, SettlementMethod, BookingRecord } from '../state/store.ts';
import { getDriverInitials } from '../components/RideCardItem.tsx';

export function RideDetailView({
  state,
  store,
}: {
  state: MarketplaceState;
  store: MarketplaceStore;
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
              {ride.stops.map((stop) => {
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
                <div>
                  <label htmlFor="seats-select" style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Number of Seats</label>
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
