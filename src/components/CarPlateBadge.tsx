import { useUiText } from './useUiText.ts';
import React from 'react';
import { formatSriLankanPlate } from '../domain/carPlate.ts';

export interface CarPlateBadgeProps {
  plate?: string;
  isMasked?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const CarPlateBadge: React.FC<CarPlateBadgeProps> = ({
  plate = 'WP CAB-••••',
  isMasked = false,
  size = 'sm',
  className = '',
}) => {
  const { tr, uiLocale } = useUiText();
  const info = formatSriLankanPlate(plate);
  const displayReg = isMasked
    ? (info.isValidFormat ? info.masked.replace(`${info.province} `, '') : '••••')
    : info.registration;

  const isSmall = size === 'sm';

  return (
    <div
      className={`inline-flex items-center font-mono font-bold tracking-wider rounded border select-none transition-shadow ${
        info.isEv
          ? 'bg-emerald-50 text-emerald-950 border-emerald-500 shadow-sm'
          : 'bg-slate-50 text-slate-900 border-slate-700 shadow-sm'
      } ${
        isSmall
          ? 'text-[11px] h-6 px-1.5 gap-1'
          : 'text-[13px] h-7 px-2 gap-1.5'
      } ${className}`}
      title={info.full}
      aria-label={tr("Vehicle plate {0}", { "0": isMasked ? info.masked : info.full })}
    >
      {/* Province code badge */}
      <span
        className={`uppercase font-sans font-extrabold tracking-normal opacity-75 ${
          isSmall ? 'text-[9px]' : 'text-[10px]'
        }`}
      >
        {info.province}
      </span>

      {/* Hairline divider */}
      <span
        className={`w-px self-stretch my-0.5 ${
          info.isEv ? 'bg-emerald-300' : 'bg-slate-400'
        }`}
        aria-hidden="true"
      />

      {/* Plate registration series */}
      <span className="tracking-widest">{displayReg}</span>

      {/* EV Tag pill if Electric Vehicle */}
      {info.isEv && (
        <span
          className={`ml-0.5 px-1 rounded-sm bg-emerald-600 text-white font-sans font-bold uppercase ${
            isSmall ? 'text-[7px] leading-tight' : 'text-[8px] leading-tight'
          }`}
        >
          EV
        </span>
      )}
    </div>
  );
};
