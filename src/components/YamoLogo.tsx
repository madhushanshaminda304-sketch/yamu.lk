import { useUiText } from './useUiText.ts';
import React from 'react';

export function YamoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, borderRadius: `${Math.round(size * 0.25)}px` }}
      aria-label="Yamo Brand Icon"
    >
      {/* Ceylon Emerald Squircle (#047857) */}
      <rect width="64" height="64" rx="16" fill="#047857" />

      {/* Geometric Y: Two connecting roads converging into one shared journey */}
      {/* Left Road Branch */}
      <path
        d="M17 16 C21 28, 28 32, 32 36 L32 50"
        stroke="#FFFFFF"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Right Road Branch */}
      <path
        d="M47 16 C43 28, 36 32, 32 36 L32 50"
        stroke="#FFFFFF"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Sunburst Gold Highway Convergence Dot */}
      <circle cx="32" cy="36" r="3.5" fill="#f59e0b" />
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
  const { tr, uiLocale } = useUiText();
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
          >{tr("Sri Lanka")}</span>
        )}
      </div>
    </div>
  );
}
