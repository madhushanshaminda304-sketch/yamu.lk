import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CheckCircle,
  Clock,
  MapPin,
  QrCode,
  Money,
  ArrowRight,
  CarSimple,
} from '@phosphor-icons/react';
import type { PassengerRideRequest } from '../domain/passengerRequests.ts';
import { formatLkr, formatColomboDate } from '../domain/i18n.ts';
import { triggerHaptic } from '../native/haptics.ts';

interface PassengerRequestCardProps {
  request: PassengerRideRequest;
  onOfferSeat?: (req: PassengerRideRequest) => void;
}

export function PassengerRequestCard({ request, onOfferSeat }: PassengerRequestCardProps) {
  const navigate = useNavigate();

  const handleOfferSeat = () => {
    triggerHaptic('selection');
    if (onOfferSeat) {
      onOfferSeat(request);
    } else {
      navigate(
        `/publish?from=${encodeURIComponent(request.originHubId)}&to=${encodeURIComponent(
          request.destinationHubId
        )}&date=${encodeURIComponent(request.date)}&time=${encodeURIComponent(
          request.time
        )}&reqId=${encodeURIComponent(request.id)}`
      );
    }
  };

  const isMatched = request.status === 'matched' || request.status === 'fulfilled';

  return (
    <article
      className="passenger-request-card"
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        position: 'relative',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Top Row: User & Verification Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(4, 120, 87, 0.2)',
            }}
          >
            {request.avatarInitials}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--bbc-navy, #0f172a)' }}>
                {request.passengerName}
              </span>
              {request.isNicVerified && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#047857',
                    background: '#ecfdf5',
                    padding: '2px 7px',
                    borderRadius: '9999px',
                    border: '1px solid #a7f3d0',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                  title="National Identity Card Verified"
                >
                  <CheckCircle size={12} weight="fill" />
                  <span>NIC Verified</span>
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={13} />
              <span>
                {formatColomboDate(`${request.date}T12:00:00+05:30`)} at {request.time}
              </span>
              {request.isCommute && (
                <span style={{ color: '#0284c7', fontWeight: 700 }}>• Weekday Commute</span>
              )}
            </div>
          </div>
        </div>

        {/* Status / Seats Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#1e293b',
              background: '#f1f5f9',
              padding: '4px 9px',
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Users size={14} weight="bold" />
            <span>{request.seatsNeeded} {request.seatsNeeded === 1 ? 'Seat Needed' : 'Seats Needed'}</span>
          </span>
          {isMatched ? (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#047857',
                background: '#d1fae5',
                padding: '4px 8px',
                borderRadius: '8px',
              }}
            >
              ✓ Seat Offered
            </span>
          ) : (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#d97706',
                background: '#fef3c7',
                padding: '4px 8px',
                borderRadius: '8px',
              }}
            >
              ⚡ Looking for Seat
            </span>
          )}
        </div>
      </div>

      {/* Route Timeline */}
      <div
        style={{
          background: '#f8fafc',
          padding: '12px 14px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14.5px', fontWeight: 700, color: 'var(--bbc-navy)' }}>
          <span>{request.originName}</span>
          <ArrowRight size={16} color="#047857" weight="bold" />
          <span>{request.destinationName}</span>
        </div>

        {request.pickupLandmark && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#475569' }}>
            <MapPin size={13} color="#047857" weight="bold" />
            <span>Pickup: <strong>{request.pickupLandmark}</strong></span>
          </div>
        )}
      </div>

      {/* Special Note */}
      {request.specialNotes && (
        <div style={{ fontSize: '12.5px', color: '#475569', fontStyle: 'italic', background: '#fafafa', padding: '6px 10px', borderRadius: '6px' }}>
          "{request.specialNotes}"
        </div>
      )}

      {/* Bottom Row: Contribution & Offer Action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          paddingTop: '8px',
          borderTop: '1px solid #f1f5f9',
        }}
      >
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Willing to Split
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#047857' }}>
              {formatLkr(request.targetContributionLkr)}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: request.settlementPreference === 'lankaqr' ? '#047857' : '#475569',
                background: request.settlementPreference === 'lankaqr' ? '#ecfdf5' : '#f1f5f9',
                padding: '2px 6px',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              {request.settlementPreference === 'lankaqr' ? (
                <>
                  <QrCode size={12} weight="bold" />
                  <span>LankaQR</span>
                </>
              ) : (
                <>
                  <Money size={12} weight="bold" />
                  <span>Cash</span>
                </>
              )}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOfferSeat}
          disabled={isMatched}
          style={{
            background: isMatched ? '#94a3b8' : 'linear-gradient(135deg, #174D3A 0%, #047857 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '9999px',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: isMatched ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: isMatched ? 'none' : '0 2px 6px rgba(23, 77, 58, 0.25)',
            transition: 'all 0.15s ease',
          }}
        >
          <CarSimple size={16} weight="bold" />
          <span>{isMatched ? 'Seat Already Offered' : 'Offer Your Seat to This Passenger'}</span>
        </button>
      </div>
    </article>
  );
}
