import React, { useState } from 'react';
import {
  X,
  WhatsappLogo,
  MapPin,
  ShareNetwork,
  Phone,
  ShieldCheck,
  Ticket,
  CheckCircle,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { YamoIcon } from './YamoLogo.tsx';
import { CarPlateBadge } from './CarPlateBadge.tsx';
import { SafetyCenterModal } from './SafetyCenterModal.tsx';
import { LeafletRouteMap } from './LeafletRouteMap.tsx';
import { getHubById } from '../domain/corridors.ts';
import { extractRouteMapWaypoints } from '../domain/routeMapGeometry.ts';
import { formatLkr, t, type LocaleCode } from '../domain/i18n.ts';
import {
  buildWhatsAppCoordinationUrl,
  buildGoogleMapsLandmarkUrl,
  deriveBoardingPin,
  buildSafetyShareText,
  shareTripDetails,
} from '../domain/sharing.ts';
import type { Ride } from '../domain/matching.ts';
import type { BookingRecord, UserProfile } from '../state/types.ts';

export interface RidePassModalProps {
  isOpen: boolean;
  onClose: () => void;
  ride: Ride;
  booking: BookingRecord;
  driver?: UserProfile;
  currentUser?: UserProfile | null;
  locale?: LocaleCode;
}

export const RidePassModal: React.FC<RidePassModalProps> = ({
  isOpen,
  onClose,
  ride,
  booking,
  driver,
  currentUser,
  locale,
}) => {
  const [showSafetyCenter, setShowSafetyCenter] = useState(false);
  const [showLiveMap, setShowLiveMap] = useState(true);
  if (!isOpen) return null;

  const currentLocale = locale ?? 'en-LK';
  const langKey = currentLocale.slice(0, 2) as 'en' | 'si' | 'ta';
  const fromHub = getHubById(booking.fromHubId);
  const toHub = getHubById(booking.toHubId);
  const fromName = fromHub?.name[langKey] ?? fromHub?.name.en ?? booking.fromHubId;
  const toName = toHub?.name[langKey] ?? toHub?.name.en ?? booking.toHubId;

  const effectiveDriver: UserProfile = driver ?? {
    id: ride.driver.id,
    name: ride.driver.name,
    email: '',
    phone: ride.driver.phone || '+94 77 123 4567',
    nicNumber: '',
    licenceNumber: '',
    verifiedPhone: ride.driver.verifiedPhone,
    verifiedNic: ride.driver.verifiedNic,
    verifiedLicence: ride.driver.verifiedLicence,
    hasProfilePhoto: true,
    bio: ride.driver.bio ?? '',
    completedRidesLast12Months: ride.driver.completedRides,
    overallRating: ride.driver.rating,
    ratingsCount: ride.driver.ratingsCount,
    drivingSkillScore: ride.driver.drivingSkillScore,
    cancellationRatePercent: 0,
    avgResponseHours: ride.driver.responseHours,
    defaultVehicle: ride.vehicle.makeModel,
    comfort: ride.comfort,
  };

  const driverPhone = effectiveDriver.phone || ride.driver.phone || '+94 77 123 4567';
  const landmark =
    booking.fromIndex === 0
      ? ride.stops[0]?.pickupLandmark || fromHub?.landmarks[0] || 'Designated Pickup Hub'
      : fromHub?.landmarks[0] || 'Designated Pickup Hub';

  const boardingPin = deriveBoardingPin(booking.id);
  const mapsUrl = buildGoogleMapsLandmarkUrl(landmark, fromHub?.lat, fromHub?.lng);
  const whatsAppUrl = buildWhatsAppCoordinationUrl(driverPhone, ride, booking, landmark);
  const safetyText = buildSafetyShareText(ride, booking, effectiveDriver);

  const handleShare = async () => {
    const res = await shareTripDetails(safetyText);
    if (res.method === 'clipboard' && res.success) {
      toast.success('Trip safety details copied to clipboard!', {
        description: 'You can paste it into WhatsApp, SMS, or Telegram to share with family.',
      });
    } else if (res.method === 'native' && res.success) {
      toast.success('Shared trip details successfully!');
    }
  };

  const formattedTime = ride.departureAt.includes('T')
    ? ride.departureAt.split('T')[1].slice(0, 5)
    : ride.departureAt;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pass Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 text-white p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <YamoIcon size={24} />
              <span className="font-bold text-lg tracking-wide">Yamo {t(currentLocale, 'ridepass.title')}</span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close pass"
              className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
            >
              <X size={20} weight="bold" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xl font-extrabold flex items-center gap-2">
              <span>{fromName}</span>
              <span className="text-amber-300">➔</span>
              <span>{toName}</span>
            </div>
            <span className="bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold">
              {ride.corridorCode}
            </span>
          </div>

          {/* Offline Ready Badge */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 text-xs font-medium border border-emerald-300/30">
            <CheckCircle size={14} weight="fill" className="text-emerald-300" />
            <span>Saved on device · Accessible offline without mobile data</span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Driver Journey Status Banner */}
          {ride.journeyStatus === 'departed' && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-extrabold text-emerald-900">
                  DRIVER IS EN ROUTE
                </span>
              </div>
              <span className="text-xs font-semibold text-emerald-700">Trip Active</span>
            </div>
          )}

          {/* Guest Booking Info */}
          {booking.isBookingForOther && (
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 text-xs">
              <span className="font-bold text-amber-900 block mb-0.5">👤 Guest Passenger Booking</span>
              <div className="text-amber-800">
                <strong>{booking.passengerName}</strong> ({booking.passengerPhone || 'No phone'})
                {booking.bookerName && (
                  <span className="block text-amber-700 text-[11px] mt-0.5">
                    Reserved by account holder: {booking.bookerName}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Boarding PIN Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <span className="text-xs uppercase tracking-wider text-amber-800 font-semibold block">
              {t(currentLocale, 'ridepass.pin')}
            </span>
            <span className="text-3xl font-mono font-black text-amber-900 tracking-widest block my-1">
              #{boardingPin}
            </span>
            <span className="text-xs text-amber-700">
              {t(currentLocale, 'ridepass.pin_desc')}
            </span>
          </div>

          {/* Trip Summary Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="text-gray-500 text-xs block">Departure</span>
              <span className="font-semibold text-gray-900">{ride.departureDate} at {formattedTime}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="text-gray-500 text-xs block">Seats & Fare</span>
              <span className="font-semibold text-gray-900">
                {booking.seats} seat(s) · {formatLkr(booking.totalPriceLkr)}
              </span>
            </div>
          </div>

          {/* Meeting Landmark & Live Pickup Map */}
          <div className="p-3.5 bg-sky-50 border border-sky-100 rounded-xl space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-sky-800 uppercase tracking-wide block flex items-center gap-1">
                  <MapPin size={14} weight="fill" className="text-sky-600" />
                  Pickup Point
                </span>
                <p className="font-bold text-gray-900 mt-0.5 text-sm">{landmark}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowLiveMap((prev) => !prev)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition"
                >
                  <span>{showLiveMap ? '🗺️ Hide Map' : '🗺️ Live Radar'}</span>
                </button>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition"
                >
                  <MapPin size={14} weight="bold" />
                  <span>Maps Pin</span>
                </a>
              </div>
            </div>

            {showLiveMap && ride.stops && ride.stops.length > 0 && (
              <LeafletRouteMap
                waypoints={extractRouteMapWaypoints(ride.stops, booking.fromHubId, booking.toHubId, langKey)}
                height={225}
                rideId={ride.id}
                currentUserId={currentUser?.id || booking.passengerId}
                currentUserName={booking.passengerName}
                userRole={currentUser?.id === ride.driverId ? 'driver' : 'passenger'}
                enableLiveTracking={true}
                journeyStatus={ride.journeyStatus}
              />
            )}
          </div>

          {/* Driver Information Card */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <span className="text-xs uppercase font-semibold text-gray-500 tracking-wider block mb-2">
              {t(currentLocale, 'ridepass.driver')} & Vehicle Information
            </span>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-gray-900">{effectiveDriver.name}</span>
                  {effectiveDriver.verifiedPhone && (
                    <span title="Verified Driver">
                      <ShieldCheck size={16} weight="fill" className="text-emerald-600" />
                    </span>
                  )}
                  {effectiveDriver.overallRating > 0 && (
                    <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                      ★ {effectiveDriver.overallRating.toFixed(1)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  {effectiveDriver.defaultVehicle || ride.vehicle.makeModel}
                </p>
                <p className="text-xs font-mono text-gray-500 mt-0.5">{driverPhone}</p>
              </div>

              <div className="flex flex-col gap-1.5 items-end">
                <CarPlateBadge
                  plate={ride.vehicle.plateNumber || 'WP CAB-1234'}
                  isMasked={false}
                  size="sm"
                />
                <a
                  href={`tel:${driverPhone}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-white text-xs font-medium transition shadow-sm"
                >
                  <Phone size={14} weight="bold" />
                  <span>Call</span>
                </a>
              </div>
            </div>
          </div>

          {/* Settle Onboard Note */}
          <div className="p-3 bg-emerald-50/60 border border-emerald-200/60 rounded-xl flex items-center justify-between text-xs text-emerald-900">
            <span>
              Payment: <strong>{formatLkr(booking.totalPriceLkr)}</strong> via{' '}
              {booking.settlementMethod === 'lankaqr' ? 'LankaQR' : 'Cash Onboard'} directly to driver.
            </span>
            <span className="text-emerald-700 font-semibold uppercase">No Advance Fee</span>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSafetyCenter(true)}
            className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-800 font-semibold text-xs transition shrink-0"
            title="Open Safety Center & Sri Lanka Hotlines"
          >
            <ShieldCheck size={18} weight="fill" className="text-rose-600" />
            <span>Safety Center</span>
          </button>

          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow transition text-center"
          >
            <WhatsappLogo size={18} weight="fill" />
            <span>{t(currentLocale, 'ridepass.whatsapp')}</span>
          </a>

          <button
            onClick={handleShare}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gray-900 hover:bg-black text-white font-semibold text-xs shadow transition text-center"
          >
            <ShareNetwork size={18} weight="bold" />
            <span>{t(currentLocale, 'ridepass.safety_share')}</span>
          </button>
        </div>
      </div>

      <SafetyCenterModal
        isOpen={showSafetyCenter}
        onClose={() => setShowSafetyCenter(false)}
        ride={ride}
        booking={booking}
        currentUser={currentUser}
        driver={effectiveDriver}
      />
    </div>
  );
};
