import React from 'react';
import { X, CheckCircle, WarningCircle, ShieldCheck, QrCode, Money, Car, Bus, Users } from '@phosphor-icons/react';
import { formatLkr, t } from '../domain/i18n.ts';
import { useMarketplaceStore } from '../state/store.ts';

interface CompareAlternativesModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromName: string;
  toName: string;
  yamoPriceLkr: number;
  corridorCode?: string;
  hasTolls?: boolean;
}

export function CompareAlternativesModal({
  isOpen,
  onClose,
  fromName,
  toName,
  yamoPriceLkr,
  corridorCode = 'Expressway',
  hasTolls = true,
}: CompareAlternativesModalProps) {
  const locale = useMarketplaceStore((s) => s.locale);
  if (!isOpen) return null;

  // Approximate solo car/taxi and highway bus benchmarks for Sri Lanka intercity corridors
  const estimatedSoloCostLkr = Math.max(5000, Math.round(yamoPriceLkr * 3.2 / 100) * 100);
  const estimatedBusPriceLkr = Math.max(850, Math.round(yamoPriceLkr * 0.65 / 50) * 50);

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
    >
      <div
        className="modal-card"
        style={{
          background: '#ffffff',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative',
          padding: '28px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 800, color: '#047857', background: '#ecfdf5', padding: '3px 8px', borderRadius: '9999px', border: '1px solid #a7f3d0', marginBottom: '6px' }}>
              <span>🇱🇰 SRI LANKA TRAVEL COMPARISON</span>
            </div>
            <h2 id="compare-modal-title" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--bbc-navy)', margin: 0 }}>
              {t(locale, 'compare.title')}
            </h2>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: '4px 0 0' }}>
              {fromName} ↔ {toName} ({corridorCode})
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
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#475569',
            }}
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* 3-Column Comparison Table / Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '22px' }}>
          {/* Option 1: Solo Car / Taxi */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#475569' }}>
              <Car size={16} />
              <span>{t(locale, 'compare.taxi')}</span>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#dc2626' }}>
                ~{formatLkr(estimatedSoloCostLkr)}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>100% fuel + full toll</div>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
                <WarningCircle size={14} color="#dc2626" weight="fill" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Highest travel expense</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
                <WarningCircle size={14} color="#dc2626" weight="fill" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Heavy fuel burning</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
                <WarningCircle size={14} color="#dc2626" weight="fill" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Solo driving fatigue</span>
              </li>
            </ul>
          </div>

          {/* Option 2: Highway Bus at MMC */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#475569' }}>
              <Bus size={16} />
              <span>{t(locale, 'compare.bus')}</span>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#d97706' }}>
                ~{formatLkr(estimatedBusPriceLkr)}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Standard public transit</div>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
                <WarningCircle size={14} color="#d97706" weight="fill" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Long terminal queues</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
                <WarningCircle size={14} color="#d97706" weight="fill" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Terminal-to-terminal only</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
                <WarningCircle size={14} color="#d97706" weight="fill" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>No exit interchange drop</span>
              </li>
            </ul>
          </div>

          {/* Option 3: Yamo Shared Seat */}
          <div
            style={{
              background: '#ecfdf5',
              border: '2px solid #047857',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: '0 4px 12px rgba(4, 120, 87, 0.12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#047857' }}>
              <Users size={16} weight="bold" />
              <span>{t(locale, 'compare.yamo')}</span>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#047857' }}>
                {formatLkr(yamoPriceLkr)}
              </div>
              <div style={{ fontSize: '11px', color: '#065f46', fontWeight: 700 }}>Save ~67% vs solo drive</div>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: '12px', color: '#065f46', display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: 600 }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
                <CheckCircle size={14} color="#047857" weight="fill" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>No queues • Reserved seat</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
                <CheckCircle size={14} color="#047857" weight="fill" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>AC comfort & Super Driver</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
                <CheckCircle size={14} color="#047857" weight="fill" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Interchange exit pickup</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Anti-Scam & Settlement Reminder Banner */}
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <ShieldCheck size={28} color="#d97706" weight="fill" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#92400e', marginBottom: '4px' }}>
              {t(locale, 'compare.antiscam')}
            </div>
            <p style={{ fontSize: '12.5px', color: '#78350f', margin: 0, lineHeight: 1.5 }}>
              Never click links sent in chat to make advance bank transfers. Always settle your cost-share directly inside the car upon departure using <strong>Cash (LKR)</strong> or <strong>LankaQR Instant Scan</strong>.
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#047857', background: '#ecfdf5', padding: '3px 8px', borderRadius: '4px', border: '1px solid #a7f3d0', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <QrCode size={13} weight="bold" />
                <span>LankaQR Accepted</span>
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', background: '#ffffff', padding: '3px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Money size={13} weight="bold" />
                <span>Cash LKR Accepted</span>
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            marginTop: '20px',
            padding: '12px',
            borderRadius: '10px',
            border: 'none',
            background: 'linear-gradient(135deg, #174D3A 0%, #047857 100%)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
