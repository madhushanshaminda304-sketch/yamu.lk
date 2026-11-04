import { useUiText } from './useUiText.ts';
import React, { useEffect } from 'react';
import {
  ShieldCheck,
  PhoneCall,
  WhatsappLogo,
  ShareNetwork,
  X,
  WarningCircle,
  CheckCircle,
  Siren,
  FirstAid,
  Car,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { pushOverlayDismissHandler } from '../native/backButton.ts';
import { getHubById, getHubDisplayName } from '../domain/corridors.ts';
import {
  buildEmergencySosText,
  deriveBoardingPin,
  shareTripDetails,
  normalizeWhatsAppPhone,
} from '../domain/sharing.ts';
import type { Ride } from '../domain/matching.ts';
import type { BookingRecord, UserProfile } from '../state/types.ts';

export interface SafetyCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  ride?: Ride | null;
  booking?: BookingRecord | null;
  currentUser?: UserProfile | null;
  driver?: UserProfile | null;
}

export const SafetyCenterModal: React.FC<SafetyCenterModalProps> = ({
  isOpen,
  onClose,
  ride,
  booking,
  currentUser,
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

  const fromHub = booking ? getHubById(booking.fromHubId) : null;
  const toHub = booking ? getHubById(booking.toHubId) : null;
  const fromName = getHubDisplayName(fromHub, uiLocale) || booking?.fromHubId || tr('Pickup Origin');
  const toName = getHubDisplayName(toHub, uiLocale) || booking?.toHubId || tr('Destination');

  const passengerName = currentUser?.name || 'Passenger';
  const driverName = driver?.name || ride?.driver.name || 'Driver';
  const driverPhone = driver?.phone || ride?.driver.phone || '+94 77 123 4567';
  const vehicleModel = ride?.vehicle.makeModel || 'Vehicle';
  const vehiclePlate = ride?.vehicle.plateNumber || 'WP CAB-1234';
  const boardingPin = booking ? deriveBoardingPin(booking.id) : '1234';

  const sosText = buildEmergencySosText({
    passengerName,
    driverName,
    driverPhone,
    vehiclePlate,
    vehicleModel,
    fromName,
    toName,
    boardingPin,
  });

  const handleGeneralShare = async () => {
    const res = await shareTripDetails(sosText);
    if (res.method === 'clipboard' && res.success) {
      toast.success(tr('Emergency SOS alert copied to clipboard'), {
        description: tr("Paste into WhatsApp or SMS to send to family/friends immediately."),
      });
    } else if (res.method === 'native' && res.success) {
      toast.success(tr('Emergency SOS broadcast shared'));
    }
  };

  const trustedContacts = currentUser?.trustedContacts || [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="safety-center-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Safety Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <ShieldCheck size={26} weight="duotone" className="text-emerald-300" />
            </div>
            <div>
              <h2 id="safety-center-title" className="font-bold text-lg text-white leading-tight">{tr("Safety Center")}</h2>
              <p className="text-xs text-emerald-200/80">{tr("Sri Lanka 24/7 Hotlines & Trusted SOS")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={tr("Close Safety Center")}
            className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-800">
          {/* Emergency Hotlines Card */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
              <Siren size={15} className="text-rose-600" />{tr("National Emergency Hotlines (Toll-Free)")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <a
                href="tel:119"
                className="flex items-center sm:flex-col justify-between sm:justify-center p-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 transition-colors text-center"
              >
                <div className="flex items-center sm:flex-col gap-2">
                  <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-sm">
                    119
                  </div>
                  <div className="text-left sm:text-center">
                    <span className="text-xs font-bold text-rose-950 block">{tr("Police")}</span>
                    <span className="text-[10px] text-rose-700 block">{tr("Emergency")}</span>
                  </div>
                </div>
                <PhoneCall size={18} className="text-rose-600 sm:mt-1" />
              </a>

              <a
                href="tel:1990"
                className="flex items-center sm:flex-col justify-between sm:justify-center p-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors text-center"
              >
                <div className="flex items-center sm:flex-col gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    1990
                  </div>
                  <div className="text-left sm:text-center">
                    <span className="text-xs font-bold text-emerald-950 block">{tr("Suwa Seriya")}</span>
                    <span className="text-[10px] text-emerald-700 block">{tr("Ambulance")}</span>
                  </div>
                </div>
                <FirstAid size={18} className="text-emerald-600 sm:mt-1" />
              </a>

              <a
                href="tel:1969"
                className="flex items-center sm:flex-col justify-between sm:justify-center p-3 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 transition-colors text-center"
              >
                <div className="flex items-center sm:flex-col gap-2">
                  <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs">
                    1969
                  </div>
                  <div className="text-left sm:text-center">
                    <span className="text-xs font-bold text-sky-950 block">{tr("Expressway")}</span>
                    <span className="text-[10px] text-sky-700 block">{tr("Police Patrol")}</span>
                  </div>
                </div>
                <Car size={18} className="text-sky-600 sm:mt-1" />
              </a>
            </div>
          </div>

          {/* Trusted Contacts SOS Dispatch */}
          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <WhatsappLogo size={15} className="text-emerald-600" />{tr("Instant WhatsApp SOS to Trusted Contacts")}</h3>

            {trustedContacts.length > 0 ? (
              <div className="space-y-2">
                {trustedContacts.map((contact) => {
                  const cleanPhone = normalizeWhatsAppPhone(contact.phone);
                  const waSosUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(sosText)}`;
                  return (
                    <div
                      key={contact.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-semibold text-sm text-slate-900">{contact.name}</div>
                        <div className="text-xs text-slate-500">
                          {contact.relationship} · {contact.phone}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${contact.phone}`}
                          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                          title={tr("Call {0}", { "0": contact.name })}
                        >
                          <PhoneCall size={16} />
                        </a>
                        <a
                          href={waSosUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                        >
                          <WhatsappLogo size={16} weight="fill" />{tr("Send SOS")}</a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 text-xs text-amber-900 flex items-start gap-2.5">
                <WarningCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{tr("No emergency contacts saved yet")}</p>
                  <p className="mt-0.5 text-amber-800">{tr("Add family members or close friends in your Profile to dispatch 1-tap WhatsApp alerts with vehicle details and live tracking.")}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleGeneralShare}
              className="mt-2.5 w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <ShareNetwork size={16} />{tr("Share Trip & SOS Alert to Any App / Clipboard")}</button>
          </div>

          {/* Safety Verification Checklist */}
          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <CheckCircle size={15} className="text-emerald-600" />{tr("Onboard Commuter Safety Checklist")}</h3>
            <ul className="text-xs space-y-2 text-slate-600">
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-700">{tr("1. Verify Plate:")}</span>
                <span>{tr("Check vehicle number plate matches booking pass registration (")}{vehiclePlate}).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-700">{tr("2. Match Identity:")}</span>
                <span>{tr("Ensure driver is")} {driverName} {tr("with verified Sri Lankan NIC.")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-700">{tr("3. Boarding PIN:")}</span>
                <span>{tr("Confirm your 4-digit PIN (#")}{boardingPin}{tr(") with the driver before moving.")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-700">{tr("4. Private Cost-Sharing:")}</span>
                <span>{tr("Fare is strictly capped for shared fuel & tolls. Never pay commercial taxi rates.")}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
          >{tr("Close Safety Center")}</button>
        </div>
      </div>
    </div>
  );
};
