import React, { useState } from 'react';
import { X, CheckCircle, Handbag, QrCode, Money } from '@phosphor-icons/react';
import { ALL_HUBS } from '../domain/corridors.ts';
import { getColomboDateOffset, type LocaleCode } from '../domain/i18n.ts';
import { triggerHaptic } from '../native/haptics.ts';
import { toast } from 'sonner';
import type { PassengerRideRequest } from '../domain/passengerRequests.ts';

interface PostSeatRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (requestData: {
    passengerName: string;
    passengerPhone: string;
    originHubId: string;
    originName: string;
    destinationHubId: string;
    destinationName: string;
    date: string;
    time: string;
    seatsNeeded: number;
    targetContributionLkr: number;
    settlementPreference: 'lankaqr' | 'cash_lkr';
    pickupLandmark: string;
    specialNotes?: string;
  }) => PassengerRideRequest;
  initialFromHubId?: string;
  initialToHubId?: string;
  initialDate?: string;
  locale?: LocaleCode;
}

export function PostSeatRequestModal({
  isOpen,
  onClose,
  onSubmit,
  initialFromHubId = 'makumbura',
  initialToHubId = 'galle',
  initialDate,
  locale = 'en-LK',
}: PostSeatRequestModalProps) {
  const tomorrow = getColomboDateOffset(1);
  const langKey = locale.slice(0, 2) as 'en' | 'si' | 'ta';

  const [fromHubId, setFromHubId] = useState(initialFromHubId);
  const [toHubId, setToHubId] = useState(initialToHubId);
  const [date, setDate] = useState(initialDate || tomorrow);
  const [time, setTime] = useState('17:30');
  const [seatsNeeded, setSeatsNeeded] = useState(1);
  const [targetContributionLkr, setTargetContributionLkr] = useState(1750);
  const [settlementPreference, setSettlementPreference] = useState<'lankaqr' | 'cash_lkr'>('lankaqr');
  const [pickupLandmark, setPickupLandmark] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passengerName.trim()) {
      toast.error('Please enter your name.');
      return;
    }
    if (!passengerPhone.trim()) {
      toast.error('Please enter your mobile phone number.');
      return;
    }
    if (fromHubId === toHubId) {
      toast.error('Pickup origin and destination cannot be the same hub.');
      return;
    }

    const fromHub = ALL_HUBS.find((h) => h.id === fromHubId);
    const toHub = ALL_HUBS.find((h) => h.id === toHubId);

    const originName = fromHub?.name[langKey] || fromHub?.name.en || fromHubId;
    const destinationName = toHub?.name[langKey] || toHub?.name.en || toHubId;

    onSubmit({
      passengerName: passengerName.trim(),
      passengerPhone: passengerPhone.trim(),
      originHubId: fromHubId,
      originName,
      destinationHubId: toHubId,
      destinationName,
      date,
      time,
      seatsNeeded,
      targetContributionLkr,
      settlementPreference,
      pickupLandmark: pickupLandmark.trim() || 'Interchange / MMC Concourse',
      specialNotes: specialNotes.trim() || undefined,
    });

    triggerHaptic('success');
    toast.success('Your seat request has been posted! Drivers on this corridor will be notified.');
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-modal-title"
    >
      <div
        className="modal-card"
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          position: 'relative',
          padding: '24px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 id="request-modal-title" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--bbc-navy)', margin: 0 }}>
              🙋‍♂️ Post a Seat Request
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
              Fill in your trip details in 15 seconds. Drivers offering rides will reach out!
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#475569',
            }}
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Your Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Kasun Fernando"
                value={passengerName}
                onChange={(e) => setPassengerName(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Mobile Number
              </label>
              <input
                type="tel"
                required
                placeholder="07X XXX XXXX"
                value={passengerPhone}
                onChange={(e) => setPassengerPhone(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Pickup Origin
              </label>
              <select
                value={fromHubId}
                onChange={(e) => setFromHubId(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              >
                {ALL_HUBS.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name[langKey] || h.name.en}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Destination
              </label>
              <select
                value={toHubId}
                onChange={(e) => setToHubId(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              >
                {ALL_HUBS.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name[langKey] || h.name.en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Travel Date
              </label>
              <input
                type="date"
                min={getColomboDateOffset(0)}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Preferred Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Seats Needed
              </label>
              <select
                value={seatsNeeded}
                onChange={(e) => setSeatsNeeded(Number(e.target.value))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'Passenger (1 seat)' : 'Passengers'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Contribution per Seat (LKR)
              </label>
              <input
                type="number"
                min={200}
                max={15000}
                step={50}
                value={targetContributionLkr}
                onChange={(e) => setTargetContributionLkr(Number(e.target.value))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
              Settlement Preference
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setSettlementPreference('lankaqr')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: settlementPreference === 'lankaqr' ? '2px solid #047857' : '1px solid #cbd5e1',
                  background: settlementPreference === 'lankaqr' ? '#ecfdf5' : '#ffffff',
                  color: settlementPreference === 'lankaqr' ? '#047857' : '#475569',
                }}
              >
                <QrCode size={16} weight="bold" />
                <span>LankaQR Scan</span>
              </button>
              <button
                type="button"
                onClick={() => setSettlementPreference('cash_lkr')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: settlementPreference === 'cash_lkr' ? '2px solid #047857' : '1px solid #cbd5e1',
                  background: settlementPreference === 'cash_lkr' ? '#ecfdf5' : '#ffffff',
                  color: settlementPreference === 'cash_lkr' ? '#047857' : '#475569',
                }}
              >
                <Money size={16} weight="bold" />
                <span>Cash Handover</span>
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
              Convenient Pickup Landmark
            </label>
            <input
              type="text"
              placeholder="e.g. Makumbura MMC Gate 1, Kadawatha Interchange"
              value={pickupLandmark}
              onChange={(e) => setPickupLandmark(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
              Special Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Traveling with laptop backpack only, flexible by 15 mins"
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 2,
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #174D3A 0%, #047857 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(4, 120, 87, 0.25)',
              }}
            >
              Post Seat Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
