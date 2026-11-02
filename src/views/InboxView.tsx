import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChatCircleDots,
  Car,
  MagnifyingGlass,
  PlusCircle,
  ShieldCheck,
  WhatsappLogo,
  Phone,
  CheckCircle,
  Star,
  X,
  PaperPlaneTilt,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { formatColomboDate, t } from '../domain/i18n.ts';
import { buildWhatsAppCoordinationUrl, normalizeWhatsAppPhone } from '../domain/sharing.ts';
import type { MarketplaceStore, MarketplaceState } from '../state/store.ts';
import {
  aggregateInboxThreads,
  formatRelativeTime,
  type ConversationThread,
} from '../domain/inbox.ts';

export { aggregateInboxThreads, formatRelativeTime, type ConversationThread };

export interface InboxViewProps {
  state: MarketplaceState;
  store: MarketplaceStore;
  openAuthModal?: (onSuccess?: () => void) => void;
}

export function InboxView({ state, store, openAuthModal }: InboxViewProps) {
  const currentUser = state.currentUser;
  const locale = state.locale;

  // Active chat drawer state
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatWarning, setChatWarning] = useState<string | null>(null);

  // If user is not authenticated, show sign-in prompt
  if (!currentUser) {
    return (
      <div className="shell-narrow" style={{ padding: '64px 20px 100px', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#e6f4ea',
            color: '#00875A',
            marginBottom: '16px',
          }}
        >
          <ChatCircleDots size={36} weight="duotone" />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#002B36', marginBottom: '8px' }}>
          Sign In to Access Your Inbox
        </h2>
        <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px', fontWeight: 600 }}>
          පණිවිඩ සඳහා පිවිසෙන්න · செய்திகளுக்கு உள்நுழையவும்
        </div>
        <p style={{ color: '#4b5563', fontSize: '15px', maxWidth: '440px', margin: '0 auto 28px', lineHeight: 1.5 }}>
          Coordinate departure hubs, pickup landmarks, and travel timing safely with verified co-travellers across Sri Lanka.
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

  // Aggregate threads for current user
  const threads = aggregateInboxThreads(
    state.messages,
    state.rides,
    state.bookings,
    currentUser.name,
    state.lastReadAtByBooking,
    currentUser.id
  );

  const totalUnread = threads.reduce((acc, t) => acc + t.unreadCount, 0);

  const activeThread = activeBookingId
    ? threads.find((t) => t.bookingId === activeBookingId)
    : null;

  const handleOpenThread = (thread: ConversationThread) => {
    store.markConversationRead(thread.bookingId);
    setActiveBookingId(thread.bookingId);
    setChatWarning(null);
    setChatInput('');
  };

  const handleCloseChat = () => {
    setActiveBookingId(null);
    setChatWarning(null);
    setChatInput('');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBookingId || !chatInput.trim()) return;

    setChatWarning(null);
    const res = store.sendMessage(activeBookingId, chatInput);
    if (!res.allowed) {
      setChatWarning(res.warningMessage || 'Message blocked for safety.');
      toast.error(
        res.warningMessage ||
          'Message blocked: external payment links and advance transfer requests are prohibited.'
      );
    } else {
      toast.success('Message sent');
      setChatInput('');
      // Re-mark read so own messages don't count as unread
      store.markConversationRead(activeBookingId);
    }
  };

  return (
    <div className="shell" style={{ padding: '24px 16px 100px', maxWidth: '720px', margin: '0 auto' }}>
      {/* Mobile-Friendly Screen Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 900,
                color: '#002B36',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>Inbox</span>
              {totalUnread > 0 && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 800,
                    minWidth: '22px',
                    height: '22px',
                    borderRadius: '9999px',
                    padding: '0 6px',
                  }}
                  aria-label={`${totalUnread} unread messages`}
                >
                  {totalUnread}
                </span>
              )}
            </h1>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#64748b',
                marginTop: '3px',
                letterSpacing: '-0.1px',
              }}
            >
              පණිවිඩ / செய்திகள்
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {threads.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '56px 20px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: '#f0fdf4',
              color: '#00875A',
              marginBottom: '16px',
            }}
          >
            <ChatCircleDots size={40} weight="duotone" />
          </div>
          <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#002B36', margin: '0 0 8px' }}>
            No messages yet
          </h3>
          <p
            style={{
              color: '#64748b',
              fontSize: '14px',
              lineHeight: 1.5,
              maxWidth: '420px',
              margin: '0 auto 24px',
            }}
          >
            No messages yet. Chat with drivers or passengers once you book or offer a ride.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              to="/search"
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 18px',
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              <MagnifyingGlass size={18} weight="bold" />
              <span>Search Rides</span>
            </Link>
            <Link
              to="/publish"
              className="btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 18px',
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              <PlusCircle size={18} weight="bold" />
              <span>Offer a Ride</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Conversation Threads List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {threads.map((thread) => {
            const hasUnread = thread.unreadCount > 0;
            const timeAgo = formatRelativeTime(thread.lastSentAt);

            return (
              <div
                key={thread.bookingId}
                onClick={() => handleOpenThread(thread)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenThread(thread);
                  }
                }}
                style={{
                  background: hasUnread ? '#f0fdf4' : '#ffffff',
                  border: hasUnread ? '1.5px solid #86efac' : '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '16px 18px',
                  cursor: 'pointer',
                  boxShadow: hasUnread
                    ? '0 4px 12px rgba(0, 135, 90, 0.08)'
                    : '0 2px 6px rgba(0, 0, 0, 0.04)',
                  transition: 'transform 0.1s ease, box-shadow 0.15s ease',
                  position: 'relative',
                }}
              >
                {/* Top Row: Route Badge & Departure Date */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: hasUnread ? '#dcfce7' : '#f1f5f9',
                      color: hasUnread ? '#166534' : '#334155',
                      padding: '3px 10px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      maxWidth: '75%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Car size={14} weight="bold" />
                    <span>{thread.corridorTitle}</span>
                  </div>

                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                    {thread.departureDate ? formatColomboDate(thread.departureDate) : ''}
                  </div>
                </div>

                {/* Middle Row: Counterpart Name, Role Pill, Super Driver & Time */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '16px',
                        fontWeight: hasUnread ? 800 : 700,
                        color: '#002B36',
                      }}
                    >
                      {thread.counterpartName}
                    </span>

                    {/* Role Pill */}
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: thread.counterpartRole === 'driver' ? '#e0f2fe' : '#f3f4f6',
                        color: thread.counterpartRole === 'driver' ? '#0369a1' : '#4b5563',
                      }}
                    >
                      {thread.counterpartRole === 'driver' ? 'Driver' : 'Passenger'}
                    </span>

                    {/* Super Driver / Verified Badge */}
                    {thread.isDriverSuperDriver && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          background: '#fffbeb',
                          color: '#b45309',
                          padding: '2px 7px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        <Star size={12} weight="fill" color="#f59e0b" />
                        <span>Super Driver</span>
                      </span>
                    )}

                    {thread.isDriverVerified && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          color: '#047857',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        <CheckCircle size={13} weight="fill" />
                        <span>Verified</span>
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {timeAgo}
                  </div>
                </div>

                {/* Bottom Row: Message snippet preview & unread indicator */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '14px',
                      color: hasUnread ? '#0f172a' : '#64748b',
                      fontWeight: hasUnread ? 600 : 400,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}
                  >
                    {thread.lastMessage || 'Tap to start conversation'}
                  </div>

                  {hasUnread && (
                    <div
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: '#00875A',
                        boxShadow: '0 0 0 2px #dcfce7',
                        flexShrink: 0,
                      }}
                      aria-label="Unread conversation indicator"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Anti-Scam Ride Chat Drawer Modal */}
      {activeBookingId && activeThread && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 71, 82, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '540px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '88vh',
              overflow: 'hidden',
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '1px solid #e2e8f0',
                padding: '16px 20px',
                background: '#f8fafc',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#002B36', margin: 0 }}>
                    {activeThread.counterpartName}
                  </h3>
                  <span
                    style={{
                      padding: '2px 7px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: activeThread.counterpartRole === 'driver' ? '#e0f2fe' : '#f3f4f6',
                      color: activeThread.counterpartRole === 'driver' ? '#0369a1' : '#4b5563',
                    }}
                  >
                    {activeThread.counterpartRole === 'driver' ? 'Driver' : 'Passenger'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  {activeThread.corridorTitle}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Direct WhatsApp Callout */}
                {activeThread.counterpartPhone && (
                  <a
                    href={
                      activeThread.counterpartRole === 'driver' && activeThread.ride && activeThread.booking
                        ? buildWhatsAppCoordinationUrl(
                            activeThread.counterpartPhone,
                            activeThread.ride,
                            activeThread.booking,
                            activeThread.corridorTitle.split('→')[0].trim()
                          )
                        : `https://wa.me/${normalizeWhatsAppPhone(activeThread.counterpartPhone)}?text=${encodeURIComponent(
                            `Hi ${activeThread.counterpartName}, this is regarding our Yamo ride on ${activeThread.corridorTitle}.`
                          )}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: '#25D366',
                      color: '#ffffff',
                      textDecoration: 'none',
                    }}
                    title="Coordinate via WhatsApp"
                    aria-label="WhatsApp coordination"
                  >
                    <WhatsappLogo size={18} weight="fill" />
                  </a>
                )}

                {/* Direct Phone Call */}
                {activeThread.counterpartPhone && (
                  <a
                    href={`tel:${activeThread.counterpartPhone}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: '#0284c7',
                      color: '#ffffff',
                      textDecoration: 'none',
                    }}
                    title="Call directly"
                    aria-label="Call directly"
                  >
                    <Phone size={18} weight="bold" />
                  </a>
                )}

                {/* Close Button */}
                <button
                  type="button"
                  onClick={handleCloseChat}
                  aria-label="Close chat"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: '4px',
                  }}
                >
                  <X size={22} weight="bold" />
                </button>
              </div>
            </div>

            {/* Anti-Scam Security Banner */}
            <div
              style={{
                background: '#fffbeb',
                borderBottom: '1px solid #fef3c7',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#92400e',
              }}
            >
              <ShieldCheck size={18} weight="fill" color="#d97706" style={{ flexShrink: 0 }} />
              <div>
                <strong>Stay Safe:</strong> External payment links and advance transfer requests are
                strictly blocked. Settle in person via Cash or LankaQR.
              </div>
            </div>

            {/* Scrollable Message History */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                padding: '16px',
                minHeight: '220px',
                maxHeight: '50vh',
                background: '#f8fafc',
              }}
            >
              {state.messages.filter((m) => m.bookingId === activeBookingId).length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    color: '#94a3b8',
                    fontSize: '13px',
                    margin: 'auto',
                  }}
                >
                  No messages yet. Send a quick note to coordinate pickup location!
                </div>
              ) : (
                state.messages
                  .filter((m) => m.bookingId === activeBookingId)
                  .map((msg) => {
                    const isMe = msg.senderId === currentUser.id;
                    const time = formatRelativeTime(msg.createdAt || (msg as any).sentAt);
                    const messageBody = msg.text || (msg as any).body || '';
                    return (
                      <div
                        key={msg.id}
                        style={{
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '80%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMe ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <div
                          style={{
                            background: isMe ? '#00875A' : '#ffffff',
                            color: isMe ? '#ffffff' : '#002B36',
                            border: isMe ? 'none' : '1px solid #e2e8f0',
                            padding: '10px 14px',
                            borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            fontSize: '14px',
                            lineHeight: 1.45,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            wordBreak: 'break-word',
                          }}
                        >
                          <div>{messageBody}</div>
                        </div>
                        <div
                          style={{
                            fontSize: '10px',
                            color: '#94a3b8',
                            marginTop: '2px',
                            padding: '0 4px',
                          }}
                        >
                          {isMe ? 'You' : msg.senderName} · {time}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Scam Guard Warning */}
            {chatWarning && (
              <div
                style={{
                  background: '#fee2e2',
                  borderTop: '1px solid #fecaca',
                  color: '#991b1b',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {chatWarning}
              </div>
            )}

            {/* Chat Input Form */}
            <form
              onSubmit={handleSendMessage}
              style={{
                display: 'flex',
                gap: '8px',
                padding: '12px 16px',
                borderTop: '1px solid #e2e8f0',
                background: '#ffffff',
              }}
            >
              <input
                type="text"
                placeholder="Type a message (e.g. See you at Makumbura MMC bay)"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  fontSize: '14px',
                  outline: 'none',
                }}
                aria-label="Type message"
              />
              <button
                type="submit"
                className="btn-primary"
                style={{
                  padding: '10px 16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '10px',
                }}
              >
                <PaperPlaneTilt size={16} weight="bold" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
