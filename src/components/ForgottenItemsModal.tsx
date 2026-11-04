import { useUiText } from './useUiText.ts';
import React, { useEffect } from 'react';
import {
  Package,
  WhatsappLogo,
  PhoneCall,
  X,
  MapPin,
  CalendarBlank,
  IdentificationBadge,
  Sparkle,
  CheckCircle,
} from '@phosphor-icons/react';
import { pushOverlayDismissHandler } from '../native/backButton.ts';
import { getHubById, getHubDisplayName } from '../domain/corridors.ts';
import { deriveBoardingPin, buildForgottenItemRecoveryUrl } from '../domain/sharing.ts';
import { CarPlateBadge } from './CarPlateBadge.tsx';
import type { Ride } from '../domain/matching.ts';
import type { BookingRecord, UserProfile } from '../state/types.ts';

export interface ForgottenItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ride: Ride;
  booking: BookingRecord;
  driver?: UserProfile | null;
}

export const ForgottenItemsModal: React.FC<ForgottenItemsModalProps> = ({
  isOpen,
  onClose,
  ride,
  booking,
  driver,
}) => {
  const { tr, uiLocale } = useUiText();
  useEffect(() => {
    if (!isOpen) return;
    const unregister = pushOverlayDismissHandler(() => {
      onClose();
      return true;
    });
    return unregister;
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const fromHub = getHubById(booking.fromHubId);
  const toHub = getHubById(booking.toHubId);
  const fromName = getHubDisplayName(fromHub, uiLocale) || booking.fromHubId;
  const toName = getHubDisplayName(toHub, uiLocale) || booking.toHubId;

  const driverName = driver?.name || ride.driver.name;
  const driverPhone = driver?.phone || ride.driver.phone || '+94 77 123 4567';
  const vehicleModel = ride.vehicle.makeModel || 'Vehicle';
  const vehiclePlate = ride.vehicle.plateNumber || 'WP CAB-1234';
  const boardingPin = deriveBoardingPin(booking.id);
  const tripDate = ride.departureDate || new Date().toISOString().split('T')[0];

  const waRecoveryUrl = buildForgottenItemRecoveryUrl({
    driverPhone,
    driverName,
    fromName,
    toName,
    tripDate,
    boardingPin,
    vehicleModel,
    vehiclePlate,
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgotten-items-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-emerald-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center">
              <Package size={24} weight="duotone" className="text-amber-200" />
            </div>
            <div>
              <h2 id="forgotten-items-title" className="font-bold text-lg text-white leading-tight">{tr("Left an Item in the Car?")}</h2>
              <p className="text-xs text-amber-100/80">{tr("Direct Driver Lost & Found Recovery")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={tr("Close dialog")}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-800">
          {/* Driver & Trip Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 font-medium">{tr("Your Driver")}</div>
                <div className="font-bold text-base text-slate-900 flex items-center gap-1.5">
                  {driverName}
                  {ride.driver.isSuperDriver && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                      <Sparkle size={10} weight="fill" className="text-amber-600" />{tr("Super Driver")}</span>
                  )}
                </div>
              </div>
              <CarPlateBadge plate={vehiclePlate} isMasked={false} size="sm" />
            </div>

            <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-emerald-600 shrink-0" />
                <span className="truncate">{fromName} → {toName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarBlank size={14} className="text-slate-500 shrink-0" />
                <span>{tripDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <IdentificationBadge size={14} className="text-slate-500 shrink-0" />
                <span>{tr("PIN: #")}{boardingPin}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                <span className="truncate">{vehicleModel}</span>
              </div>
            </div>
          </div>

          {/* Quick Contact Actions */}
          <div className="space-y-2.5 pt-1">
            <a
              href={waRecoveryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors text-center"
            >
              <WhatsappLogo size={20} weight="fill" />{tr("WhatsApp Driver About Left Item")}</a>

            <a
              href={`tel:${driverPhone}`}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2 transition-colors text-center"
            >
              <PhoneCall size={16} />{tr("Call Driver Directly (")}{driverPhone})
            </a>
          </div>

          {/* Helpful Tips */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
            <div className="font-semibold text-amber-950">{tr("Sri Lanka Recovery Advice:")}</div>
            <ul className="list-disc list-inside space-y-0.5 text-amber-900/90 pl-0.5">
              <li>{tr("Drivers check their backseats between journeys; give them time to respond safely.")}</li>
              <li>{tr("When collecting, meet at a public multimodal hub or station.")}</li>
              <li>{tr("Consider offering reasonable fuel reimbursement if the driver delivers it to you.")}</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 rounded-xl text-slate-600 hover:text-slate-900 font-semibold text-xs transition-colors"
          >{tr("Close")}</button>
        </div>
      </div>
    </div>
  );
};
