import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  ChatCircleText,
  Star,
  X,
  Phone,
  WhatsappLogo,
  Ticket,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { getHubById } from '../domain/corridors.ts';
import { formatLkr, formatColomboDate } from '../domain/i18n.ts';
import type { MarketplaceStore, MarketplaceState, BookingRecord } from '../state/store.ts';
import type { Ride } from '../domain/matching.ts';
import { buildWhatsAppCoordinationUrl } from '../domain/sharing.ts';
import { RidePassModal } from '../components/RidePassModal.tsx';
import { triggerHaptic } from '../native/haptics.ts';

export function YourRidesView({
  state,
  store,
  openAuthModal,
}: {
  state: MarketplaceState;
  store: MarketplaceStore;
  openAuthModal?: (onSuccess?: () => void) => void;
}) {
  const [tab, setTab] = useState<'passenger' | 'driver'>('passenger');
  const [activePass, setActivePass] = useState<{ ride: Ride; booking: BookingRecord } | null>(null);

  // Chat Drawer
  const [activeChatBookingId, setActiveChatBookingId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatWarning, setChatWarning] = useState<string | null>(null);

  // Rating Modal
  const [activeRatingBookingId, setActiveRatingBookingId] = useState<string | null>(null);
  const [ratingTargetUserId, setRatingTargetUserId] = useState<string>('');
  const [ratingTargetName, setRatingTargetName] = useState<string>('');
  const [ratingStars, setRatingStars] = useState(5);
  const [drivingSkill, setDrivingSkill] = useState<'poor' | 'average' | 'excellent'>('excellent');
  const [ratingComment, setRatingComment] = useState('');

  if (!state.currentUser) {
    return (
      <div className="shell-narrow" style={{ padding: '64px 0', textAlign: 'center' }}>
        <div className="auth-icon-badge" style={{ marginBottom: '16px' }}>
          <Car size={28} color="var(--bbc-blue)" weight="fill" />
        </div>
        <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--bbc-navy)' }}>
          Sign In to View Your Rides
        </h2>
        <p style={{ color: 'var(--bbc-text-secondary)', fontSize: '15px', maxWidth: '480px', margin: '8px auto 28px' }}>
          Access your confirmed bookings, pending ride requests, and coordinate with co-travellers in real-time.
        </p>
        <button
          type="button"
          className="btn-primary"
          onClick={() => openAuthModal?.()}
          style={{ padding: '14px 32px', fontSize: '16px' }}
        >
          Sign In with Mobile OTP
        </button>
      </div>
    );
  }

  const currentUser = state.currentUser;
  const myBookings = state.bookings.filter((b) => b.passengerId === currentUser.id);
  const myRides = state.rides.filter((r) => r.driverId === currentUser.id);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatBookingId || !chatInput.trim()) return;
    setChatWarning(null);
    const res = store.sendMessage(activeChatBookingId, chatInput);
    if (!res.allowed) {
      setChatWarning(res.warningMessage || 'Message blocked for safety.');
      toast.error(res.warningMessage || 'Message blocked: external links and advance payments are prohibited.');
    } else {
      toast.success('Message sent');
      setChatInput('');
    }
  };

  const openRatingModal = (bookingId: string, targetUserId: string, targetName: string) => {
    setActiveRatingBookingId(bookingId);
    setRatingTargetUserId(targetUserId);
    setRatingTargetName(targetName);
    setRatingStars(5);
    setRatingComment('');
  };

  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRatingBookingId || !ratingTargetUserId) return;

    store.submitDoubleBlindRating({
      bookingId: activeRatingBookingId,
      fromUserId: currentUser.id,
      toUserId: ratingTargetUserId,
      stars: ratingStars,
      drivingSkill,
      comment: ratingComment,
    });
    toast.success('Rating submitted! It remains hidden until the other party rates or after 14 days.');
    setActiveRatingBookingId(null);
  };

  const handleDriverResponse = (bookingId: string, accept: boolean, passengerName: string) => {
    try {
      store.respondToBooking(bookingId, accept);
      if (accept) {
        toast.success(`Accepted booking request from ${passengerName}!`);
      } else {
        toast.info(`Declined booking request from ${passengerName}.`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed.');
    }
  };

  return (
    <div className="shell" style={{ padding: '20px 0 88px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: 'clamp(22px, 6vw, 26px)', fontWeight: 800, color: 'var(--bbc-navy)', marginBottom: '14px' }}>
          Your Rides & Bookings
        </h1>
        <div className="segmented-tab-strip" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'passenger'}
            className={`segmented-tab-btn ${tab === 'passenger' ? 'active' : ''}`}
            onClick={() => {
              triggerHaptic('selection');
              setTab('passenger');
            }}
          >
            As Passenger ({myBookings.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'driver'}
            className={`segmented-tab-btn ${tab === 'driver' ? 'active' : ''}`}
            onClick={() => {
              triggerHaptic('selection');
              setTab('driver');
            }}
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
              const driverPhoneDigits = (ride?.driver.phone || '+94772345678').replace(/\D/g, '');

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

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--bbc-border)', paddingTop: '16px', flexWrap: 'wrap', gap: '8px' }}>
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
                        <>
                          <button
                            type="button"
                            className="btn-primary btn-sm"
                            style={{ background: '#0284c7' }}
                            onClick={() => setActivePass({ ride, booking: bk })}
                          >
                            <Ticket size={16} weight="bold" />
                            <span>Digital Ride Pass</span>
                          </button>

                          <a
                            href={buildWhatsAppCoordinationUrl(
                              ride.driver.phone || '+94772345678',
                              ride,
                              bk,
                              ride.stops[bk.fromIndex]?.pickupLandmark || fromName
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-secondary btn-sm"
                            style={{ color: '#2e7d32' }}
                            aria-label="Contact driver via WhatsApp"
                          >
                            <WhatsappLogo size={16} />
                            <span>WhatsApp</span>
                          </a>

                          <a
                            href={`tel:${ride.driver.phone || '+94772345678'}`}
                            className="btn-secondary btn-sm"
                            aria-label="Direct phone call to driver"
                          >
                            <Phone size={16} />
                            <span>Call</span>
                          </a>
                        </>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {bk.status === 'accepted' && ride && (
                        <button
                          type="button"
                          className="btn-secondary btn-sm"
                          onClick={() => openRatingModal(bk.id, ride.driverId, ride.driver.name)}
                        >
                          <Star size={16} color="#f57f17" weight="fill" />
                          <span>Rate Driver</span>
                        </button>
                      )}

                      {bk.status !== 'cancelled' && (
                        <button
                          type="button"
                          className="btn-secondary btn-sm"
                          style={{ color: 'var(--bbc-red)' }}
                          onClick={() => {
                            store.cancelBooking(bk.id);
                            toast.info('Booking cancelled.');
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {visibleRatings.length > 0 && (
                    <div style={{ marginTop: '14px', background: '#f9fbfb', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                      <strong>Revealed Review:</strong> {visibleRatings[0].stars}★ — "{visibleRatings[0].comment}"
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
              <Car size={48} color="var(--bbc-text-secondary)" weight="duotone" />
              <h3 style={{ fontSize: '18px', fontWeight: 800, marginTop: '16px', color: 'var(--bbc-navy)' }}>
                No published rides yet
              </h3>
              <p style={{ color: 'var(--bbc-text-secondary)', margin: '8px 0 20px' }}>
                Driving somewhere in Sri Lanka? Offer your empty car seats and share fuel & toll costs.
              </p>
              <Link to="/publish" className="btn-primary">Offer a ride</Link>
            </div>
          ) : (
            myRides.map((ride) => {
              const fromName = getHubById(ride.originHubId)?.name.en || ride.originHubId;
              const toName = getHubById(ride.destinationHubId)?.name.en || ride.destinationHubId;
              const rideRequests = state.bookings.filter((b) => b.rideId === ride.id);

              return (
                <div key={ride.id} style={{ background: '#ffffff', border: '1px solid var(--bbc-border)', borderRadius: 'var(--radius-md)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--bbc-text-secondary)', textTransform: 'uppercase' }}>
                        {formatColomboDate(ride.departureAt)} · {ride.corridorName}
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
                          <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bbc-surface)', borderRadius: '8px', fontSize: '14px', flexWrap: 'wrap', gap: '8px' }}>
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
                                    onClick={() => handleDriverResponse(req.id, true, req.passengerName)}
                                  >
                                    Accept
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-secondary btn-sm"
                                    style={{ padding: '4px 10px', fontSize: '12px' }}
                                    onClick={() => handleDriverResponse(req.id, false, req.passengerName)}
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
                              {req.status === 'accepted' && (
                                <button
                                  type="button"
                                  className="btn-secondary btn-sm"
                                  style={{ padding: '4px 10px', fontSize: '12px' }}
                                  onClick={() => openRatingModal(req.id, req.passengerId, req.passengerName)}
                                >
                                  Rate
                                </button>
                              )}
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
              <button type="button" onClick={() => setActiveChatBookingId(null)} aria-label="Close chat"><X size={20} /></button>
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
                    const isMe = msg.senderId === currentUser.id;
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
                aria-label="Type message"
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
                Rate {ratingTargetName || 'Travel Partner'}
              </h3>
              <button type="button" onClick={() => setActiveRatingBookingId(null)} aria-label="Close rating"><X size={20} /></button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--bbc-text-secondary)', marginBottom: '16px' }}>
              Yamo uses <strong>Double-Blind Ratings</strong>: your rating remains hidden until the other party submits theirs or 14 days pass.
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
                      aria-label={`${star} star`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="driving-skill-select" style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Driving / Travel Behaviour
                </label>
                <select
                  id="driving-skill-select"
                  value={drivingSkill}
                  onChange={(e) => setDrivingSkill(e.target.value as 'poor' | 'average' | 'excellent')}
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '14px' }}
                >
                  <option value="excellent">Excellent · Smooth & Safe</option>
                  <option value="average">Good · Standard Driving</option>
                  <option value="poor">Needs Improvement</option>
                </select>
              </div>

              <div>
                <label htmlFor="rating-comment-input" style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Review Comment</label>
                <textarea
                  id="rating-comment-input"
                  rows={3}
                  required
                  placeholder="Share details about punctuality, friendliness, and safe driving along Sri Lankan roads..."
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--bbc-border)', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="btn-secondary btn-sm" onClick={() => setActiveRatingBookingId(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary btn-sm">
                  Submit Rating
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activePass && (
        <RidePassModal
          isOpen={Boolean(activePass)}
          onClose={() => setActivePass(null)}
          ride={activePass.ride}
          booking={activePass.booking}
          locale={state.locale}
        />
      )}
    </div>
  );
}
