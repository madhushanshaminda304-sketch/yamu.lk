import React from 'react';

export function YamoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-label="Yamo Brand Icon"
    >
      {/* Background soft mint circle glow */}
      <circle cx="24" cy="24" r="23" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1.5" />

      {/* Driver road ribbon (left branch converging in Ceylon Emerald) */}
      <path
        d="M12 36 C14 26, 22 24, 24 16"
        stroke="#047857"
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* Passenger road ribbon (right branch converging in Vibrant Mint) */}
      <path
        d="M36 36 C34 26, 26 24, 24 16"
        stroke="#10b981"
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* Forward Expressway stem (Deep Pine) */}
      <path
        d="M24 16 L24 24"
        stroke="#064e3b"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Expressway Center Dash */}
      <line x1="24" y1="36" x2="24" y2="30" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />

      {/* Destination / Ceylon Sunburst Gold Sun Apex Dot */}
      <circle cx="24" cy="11" r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
    </svg>
  );
}

export function YamoBrand({
  size = 32,
  showBadge = true,
}: {
  size?: number;
  showBadge?: boolean;
}) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
      <YamoIcon size={size} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span style={{ fontSize: '24px', fontWeight: 900, color: '#064e3b', letterSpacing: '-0.5px' }}>
          yamo<span style={{ color: '#f59e0b' }}>.lk</span>
        </span>
        {showBadge && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              background: '#fef3c7',
              color: '#b45309',
              padding: '2px 7px',
              borderRadius: '9999px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginLeft: '4px',
            }}
          >
            Sri Lanka
          </span>
        )}
      </div>
    </div>
  );
}
