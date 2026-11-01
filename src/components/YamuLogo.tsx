import React from 'react';

export function YamuIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-label="Yamu Brand Icon"
    >
      {/* Background soft glow circle */}
      <circle cx="24" cy="24" r="23" fill="#e1f5fe" stroke="#b3e5fc" strokeWidth="1.5" />

      {/* Driver road ribbon (left branch converging) */}
      <path
        d="M12 36 C14 26, 22 24, 24 16"
        stroke="#00875a"
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* Passenger road ribbon (right branch converging into expressway) */}
      <path
        d="M36 36 C34 26, 26 24, 24 16"
        stroke="#00aff5"
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* Forward Expressway stem */}
      <path
        d="M24 16 L24 24"
        stroke="#054752"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Expressway Center Dash */}
      <line x1="24" y1="36" x2="24" y2="30" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />

      {/* Destination / Ceylon Gold Sun Apex Dot */}
      <circle cx="24" cy="11" r="4.5" fill="#ffb703" stroke="#ffffff" strokeWidth="1.5" />
    </svg>
  );
}

export function YamuBrand({
  size = 32,
  showBadge = true,
}: {
  size?: number;
  showBadge?: boolean;
}) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
      <YamuIcon size={size} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span style={{ fontSize: '24px', fontWeight: 900, color: '#054752', letterSpacing: '-0.5px' }}>
          yamu<span style={{ color: '#00aff5' }}>.lk</span>
        </span>
        {showBadge && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              background: '#e1f5fe',
              color: '#0077a8',
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
