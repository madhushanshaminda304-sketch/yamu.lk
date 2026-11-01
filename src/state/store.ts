import { findRouteOptions, getHubById } from '../domain/corridors.ts';
import {
  type TollPolicy,
  calculateRecommendedLkr,
  getContributionBounds,
  calculateLegContribution,
} from '../domain/pricing.ts';
import {
  type Ride,
  type RideStop,
  type ComfortProfile,
  type ApprovalMode,
  type VehicleCategory,
  canBookLeg,
  applyLegBooking,
  releaseLegBooking,
} from '../domain/matching.ts';
import {
  type DoubleBlindRating,
  type DrivingSkillLabel,
  validateSriLankaPhone,
  validateSriLankaNic,
  evaluateSuperDriver,
  resolveRatingVisibility,
} from '../domain/trust.ts';
import { inspectChatMessage, type ChatInspectionResult } from '../domain/scamGuard.ts';
import { getColomboDateOffset, type LocaleCode } from '../domain/i18n.ts';
import {
  type OtpChallenge,
  normalizeSriLankanMobile,
  createOtpChallenge,
  verifyOtpCode,
} from '../domain/auth.ts';
import { buildSeededRides } from './seededRides.ts';
import {
  type SettlementMethod,
  type BookingRecord,
  type RideAlertSubscription,
  type ChatMessage,
  type AppNotification,
  type UserProfile,
  type PublishRideInput,
  type MarketplaceState,
  SEEDED_USERS,
} from './types.ts';

export {
  buildSeededRides,
  SEEDED_USERS,
  type SettlementMethod,
  type BookingRecord,
  type RideAlertSubscription,
  type ChatMessage,
  type AppNotification,
  type UserProfile,
  type PublishRideInput,
  type MarketplaceState,
};

function loadPersistedAuth(): {
  currentUser: UserProfile | null;
  registeredUsers: Record<string, UserProfile>;
} {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('blablacar_lk_auth_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          currentUser: 'currentUser' in parsed ? parsed.currentUser : SEEDED_USERS['+94772345678'],
          registeredUsers: { ...SEEDED_USERS, ...(parsed.registeredUsers || {}) },
        };
      }
    }
  } catch {
    // fallback
  }
  return {
    currentUser: SEEDED_USERS['+94772345678'],
    registeredUsers: { ...SEEDED_USERS },
  };
}

function persistAuth(currentUser: UserProfile | null, registeredUsers: Record<string, UserProfile>) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(
        'blablacar_lk_auth_v1',
        JSON.stringify({ currentUser, registeredUsers })
      );
    }
  } catch {
    // ignore
  }
}

function addMinutesIso(dateStr: string, timeStr: string, minutesToAdd: number): string {
  const base = new Date(`${dateStr}T${timeStr}:00+05:30`);
  const target = new Date(base.getTime() + minutesToAdd * 60000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const localParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(target);
  const get = (t: string) => localParts.find((p) => p.type === t)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}T${pad(Number(get('hour')) % 24)}:${get('minute')}:00+05:30`;
}

export function createInitialState(): MarketplaceState {
  const tomorrow = getColomboDateOffset(1);
  const auth = loadPersistedAuth();
  return {
    locale: 'en-LK',
    currentUser: auth.currentUser,
    registeredUsers: auth.registeredUsers,
    activeOtpChallenge: null,
    rides: buildSeededRides(tomorrow),
    bookings: [],
    rideAlerts: [],
    messages: [],
    ratings: [],
    notifications: [
      {
        id: 'notif-welcome',
        title: 'Welcome to BlaBlaLanka (Sri Lanka Edition)',
        body: 'Your Sri Lankan NIC and +94 mobile number are verified. You hold Super Driver status.',
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

export function createMarketplaceStore(initialState?: MarketplaceState) {
  let state: MarketplaceState = initialState ?? createInitialState();
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const store = {
    getState(): MarketplaceState {
      return state;
    },

    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    setLocale(locale: LocaleCode): void {
      state = { ...state, locale };
      notify();
    },

    publishRide(input: PublishRideInput): Ride {
      if (!state.currentUser) {
        throw new Error('You must be signed in to publish a ride.');
      }
      const currentUser = state.currentUser;

      const routeOptions = findRouteOptions(input.originHubId, input.destinationHubId);
      const selectedRoute =
        routeOptions.find((r) => r.corridorId === input.corridorId) ?? routeOptions[0];

      if (!selectedRoute) {
        throw new Error('Could not compute a valid Sri Lankan corridor between these hubs.');
      }

      const recommendedLkr = calculateRecommendedLkr(
        selectedRoute.distanceKm,
        input.tollPolicy,
        selectedRoute.estimatedTollLkr
      );
      const bounds = getContributionBounds(recommendedLkr);
      const clampedPriceLkr = Math.min(bounds.maxLkr, Math.max(bounds.minLkr, input.priceLkr));

      const filteredRouteStops = selectedRoute.stops.filter((s, idx, arr) => {
        if (idx === 0 || idx === arr.length - 1) return true;
        return input.selectedStopoverHubIds.includes(s.hubId) || input.boostEnabled;
      });

      const stops: RideStop[] = filteredRouteStops.map((s, idx, arr) => {
        const isFirst = idx === 0;
        const isLast = idx === arr.length - 1;
        const arrivalIso = addMinutesIso(input.date, input.departureTime, s.minutesFromOrigin);
        const departureIso =
          isFirst || isLast
            ? arrivalIso
            : addMinutesIso(input.date, input.departureTime, s.minutesFromOrigin + 4);
        const priceFromOriginLkr = isFirst
          ? 0
          : isLast
            ? clampedPriceLkr
            : calculateLegContribution(clampedPriceLkr, selectedRoute.distanceKm, s.kmFromOrigin);

        return {
          hubId: s.hubId,
          stopIndex: idx,
          arrivalAt: arrivalIso,
          departureAt: departureIso,
          kmFromOrigin: s.kmFromOrigin,
          priceFromOriginLkr,
          pickupLandmark: isFirst
            ? input.pickupLandmark || s.defaultLandmark
            : isLast
              ? input.dropoffLandmark || s.defaultLandmark
              : s.defaultLandmark,
          isBoostStop: !isFirst && !isLast && !input.selectedStopoverHubIds.includes(s.hubId),
        };
      });

      const superStatus = evaluateSuperDriver({
        verifiedPhone: currentUser.verifiedPhone,
        verifiedNic: currentUser.verifiedNic,
        verifiedLicence: currentUser.verifiedLicence,
        hasProfilePhoto: currentUser.hasProfilePhoto,
        completedRidesLast12Months: currentUser.completedRidesLast12Months,
        overallRating: currentUser.overallRating,
        drivingSkillScore: currentUser.drivingSkillScore,
        cancellationRatePercent: currentUser.cancellationRatePercent,
        avgResponseHours: currentUser.avgResponseHours,
      });

      const newRide: Ride = {
        id: `ride-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        driverId: currentUser.id,
        corridorId: selectedRoute.corridorId,
        corridorCode: selectedRoute.corridorCode,
        corridorName: selectedRoute.corridorName,
        hasTolls: selectedRoute.hasTolls,
        tollPolicy: input.tollPolicy,
        estimatedTollLkr: selectedRoute.estimatedTollLkr,
        originHubId: input.originHubId,
        destinationHubId: input.destinationHubId,
        departureDate: input.date,
        departureAt: stops[0].departureAt,
        arrivalAt: stops[stops.length - 1].arrivalAt,
        totalDistanceKm: selectedRoute.distanceKm,
        fullPriceLkr: clampedPriceLkr,
        recommendedPriceLkr: recommendedLkr,
        totalSeats: input.seats,
        segmentSeatsAvailable: Array.from({ length: stops.length - 1 }, () => input.seats),
        stops,
        approvalMode: input.approvalMode,
        boostEnabled: input.boostEnabled,
        vehicle: {
          makeModel: input.vehicleMakeModel || currentUser.defaultVehicle,
          category: input.vehicleCategory,
          plateHint: 'WP CBX-92xx',
          acGuaranteed: input.acGuaranteed,
        },
        comfort: input.comfort,
        driver: {
          id: currentUser.id,
          name: currentUser.name,
          rating: currentUser.overallRating,
          ratingsCount: currentUser.ratingsCount,
          drivingSkillScore: currentUser.drivingSkillScore,
          completedRides: currentUser.completedRidesLast12Months,
          verifiedPhone: currentUser.verifiedPhone,
          verifiedNic: currentUser.verifiedNic,
          verifiedLicence: currentUser.verifiedLicence,
          isSuperDriver: superStatus.isSuperDriver,
          responseHours: currentUser.avgResponseHours,
          bio: currentUser.bio,
        },
        notes: input.notes,
        status: 'published',
      };

      // Check if any RideAlert matches any leg on this newly published ride
      const triggeredNotifications: AppNotification[] = [];
      for (const alert of state.rideAlerts) {
        if (alert.date === input.date) {
          const legCheck = canBookLeg(newRide, alert.fromHubId, alert.toHubId, 1);
          if (legCheck.allowed) {
            const fromName = getHubById(alert.fromHubId)?.name.en ?? alert.fromHubId;
            const toName = getHubById(alert.toHubId)?.name.en ?? alert.toHubId;
            triggeredNotifications.push({
              id: `notif-alert-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
              title: `Ride Alert Matched: ${fromName} → ${toName}`,
              body: `A new ride with ${newRide.driver.name} on ${input.date} matches your alert (${alert.email}).`,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }

      state = {
        ...state,
        rides: [newRide, ...state.rides],
        notifications: [...triggeredNotifications, ...state.notifications],
      };
      notify();
      return newRide;
    },

    bookRideLeg(input: {
      rideId: string;
      fromHubId: string;
      toHubId: string;
      seats: number;
      settlementMethod: SettlementMethod;
      message: string;
    }): BookingRecord {
      if (!state.currentUser) {
        throw new Error('You must be signed in to book a seat.');
      }
      const currentUser = state.currentUser;

      const ride = state.rides.find((r) => r.id === input.rideId);
      if (!ride) {
        throw new Error('Ride not found.');
      }

      const check = canBookLeg(ride, input.fromHubId, input.toHubId, input.seats);
      if (!check.allowed) {
        throw new Error(check.reason ?? 'Cannot book this ride leg.');
      }

      const isInstant = ride.approvalMode === 'instant';
      const nextRide = isInstant
        ? applyLegBooking(ride, check.fromIndex, check.toIndex, input.seats)
        : ride;

      const booking: BookingRecord = {
        id: `bk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        rideId: ride.id,
        passengerId: currentUser.id,
        passengerName: currentUser.name,
        passengerPhone: currentUser.phone,
        fromHubId: input.fromHubId,
        toHubId: input.toHubId,
        fromIndex: check.fromIndex,
        toIndex: check.toIndex,
        seats: input.seats,
        unitPriceLkr: check.legPriceLkr,
        totalPriceLkr: check.legPriceLkr * input.seats,
        isBoostLeg: check.isBoostLeg,
        settlementMethod: input.settlementMethod,
        status: isInstant ? 'accepted' : 'pending',
        message: input.message.trim(),
        createdAt: new Date().toISOString(),
      };

      const initialMessages: ChatMessage[] = booking.message
        ? [
            {
              id: `msg-${Date.now()}`,
              bookingId: booking.id,
              senderId: currentUser.id,
              senderName: currentUser.name,
              text: booking.message,
              createdAt: new Date().toISOString(),
            },
          ]
        : [];

      const fromName = getHubById(input.fromHubId)?.name.en ?? input.fromHubId;
      const toName = getHubById(input.toHubId)?.name.en ?? input.toHubId;

      const newNotif: AppNotification = {
        id: `notif-bk-${Date.now()}`,
        title: isInstant
          ? `Instant Booking Confirmed: ${fromName} → ${toName}`
          : `Request Sent: ${fromName} → ${toName}`,
        body: isInstant
          ? `${input.seats} seat(s) reserved with ${ride.driver.name}. Settle LKR ${booking.totalPriceLkr.toLocaleString()} onboard via ${input.settlementMethod === 'lankaqr' ? 'LankaQR' : 'Cash'}.`
          : `Awaiting approval from ${ride.driver.name} (typical response < ${ride.driver.responseHours}h).`,
        createdAt: new Date().toISOString(),
      };

      state = {
        ...state,
        rides: state.rides.map((r) => (r.id === ride.id ? nextRide : r)),
        bookings: [booking, ...state.bookings],
        messages: [...state.messages, ...initialMessages],
        notifications: [newNotif, ...state.notifications],
      };
      notify();
      return booking;
    },

    respondToBooking(bookingId: string, accept: boolean): BookingRecord {
      const booking = state.bookings.find((b) => b.id === bookingId);
      if (!booking) throw new Error('Booking not found.');
      if (booking.status !== 'pending') return booking;

      const ride = state.rides.find((r) => r.id === booking.rideId);
      if (!ride) throw new Error('Ride not found.');

      let nextRide = ride;
      let nextStatus: BookingRecord['status'] = 'declined';

      if (accept) {
        const legCheck = canBookLeg(ride, booking.fromHubId, booking.toHubId, booking.seats);
        if (!legCheck.allowed) {
          throw new Error('Cannot accept booking: insufficient seat capacity remaining on this segment.');
        }
        nextRide = applyLegBooking(ride, booking.fromIndex, booking.toIndex, booking.seats);
        nextStatus = 'accepted';
      }

      const updatedBooking: BookingRecord = {
        ...booking,
        status: nextStatus,
      };

      state = {
        ...state,
        rides: state.rides.map((r) => (r.id === ride.id ? nextRide : r)),
        bookings: state.bookings.map((b) => (b.id === bookingId ? updatedBooking : b)),
      };
      notify();
      return updatedBooking;
    },

    cancelBooking(bookingId: string): BookingRecord {
      const booking = state.bookings.find((b) => b.id === bookingId);
      if (!booking) throw new Error('Booking not found.');
      if (booking.status === 'cancelled' || booking.status === 'declined') return booking;

      const ride = state.rides.find((r) => r.id === booking.rideId);
      const nextRide =
        ride && booking.status === 'accepted'
          ? releaseLegBooking(ride, booking.fromIndex, booking.toIndex, booking.seats)
          : ride;

      const updatedBooking: BookingRecord = {
        ...booking,
        status: 'cancelled',
      };

      state = {
        ...state,
        rides: nextRide ? state.rides.map((r) => (r.id === nextRide.id ? nextRide : r)) : state.rides,
        bookings: state.bookings.map((b) => (b.id === bookingId ? updatedBooking : b)),
      };
      notify();
      return updatedBooking;
    },

    createRideAlert(input: {
      fromHubId: string;
      toHubId: string;
      date: string;
      email: string;
    }): RideAlertSubscription {
      const alert: RideAlertSubscription = {
        id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        fromHubId: input.fromHubId,
        toHubId: input.toHubId,
        date: input.date,
        email: input.email.trim(),
        createdAt: new Date().toISOString(),
      };

      state = {
        ...state,
        rideAlerts: [alert, ...state.rideAlerts],
      };
      notify();
      return alert;
    },

    sendMessage(bookingId: string, text: string): ChatInspectionResult {
      if (!state.currentUser) {
        return { allowed: false, warningMessage: 'You must be signed in to send messages.', sanitizedText: text };
      }
      const currentUser = state.currentUser;

      const inspection = inspectChatMessage(text);
      if (!inspection.allowed) {
        return inspection;
      }

      const msg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        bookingId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        text: inspection.sanitizedText,
        createdAt: new Date().toISOString(),
      };

      state = {
        ...state,
        messages: [...state.messages, msg],
      };
      notify();
      return inspection;
    },

    submitDoubleBlindRating(input: {
      bookingId: string;
      fromUserId: string;
      toUserId: string;
      stars: number;
      drivingSkill?: DrivingSkillLabel;
      comment: string;
    }): DoubleBlindRating {
      const booking = state.bookings.find((b) => b.id === input.bookingId);
      const ride = booking ? state.rides.find((r) => r.id === booking.rideId) : undefined;

      const rating: DoubleBlindRating = {
        id: `rat-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        bookingId: input.bookingId,
        fromUserId: input.fromUserId,
        toUserId: input.toUserId,
        stars: Math.min(5, Math.max(1, input.stars)),
        drivingSkill: input.drivingSkill,
        comment: input.comment.trim(),
        createdAt: new Date().toISOString(),
        tripArrivalAt: ride?.arrivalAt ?? new Date().toISOString(),
      };

      const updatedRatings = [...state.ratings, rating];

      // Update aggregate rating stats for the recipient
      const recipientRatings = updatedRatings.filter((r) => r.toUserId === input.toUserId);
      const avgStars = Number((recipientRatings.reduce((sum, r) => sum + r.stars, 0) / recipientRatings.length).toFixed(2));
      const ratingCount = recipientRatings.length;

      const updatedRides = state.rides.map((r) => {
        if (r.driverId === input.toUserId) {
          return {
            ...r,
            driver: {
              ...r.driver,
              rating: avgStars,
              ratingsCount: ratingCount,
            },
          };
        }
        return r;
      });

      const updatedCurrentUser =
        state.currentUser && state.currentUser.id === input.toUserId
          ? { ...state.currentUser, overallRating: avgStars, ratingsCount: ratingCount }
          : state.currentUser;

      state = {
        ...state,
        ratings: updatedRatings,
        rides: updatedRides,
        currentUser: updatedCurrentUser,
      };
      notify();
      return rating;
    },

    getVisibleRatingsForBooking(
      bookingId: string,
      nowIso = new Date().toISOString()
    ): DoubleBlindRating[] {
      const bookingRatings = state.ratings.filter((r) => r.bookingId === bookingId);
      const uniqueRaters = new Set(bookingRatings.map((r) => r.fromUserId));
      const bothRated = uniqueRaters.size >= 2;

      return bookingRatings.filter((r) => resolveRatingVisibility(r, bothRated, nowIso));
    },

    requestPhoneOtp(phoneInput: string, now = Date.now()): { ok: boolean; code?: string; error?: string } {
      const norm = normalizeSriLankanMobile(phoneInput);
      if (!norm.valid || !norm.phone) {
        return { ok: false, error: norm.error || 'Invalid Sri Lankan mobile number.' };
      }

      if (
        state.activeOtpChallenge &&
        state.activeOtpChallenge.phone === norm.phone &&
        state.activeOtpChallenge.attemptsRemaining > 0 &&
        now < state.activeOtpChallenge.resendAvailableAt
      ) {
        const waitSeconds = Math.ceil((state.activeOtpChallenge.resendAvailableAt - now) / 1000);
        return {
          ok: false,
          error: `Please wait ${waitSeconds} second${waitSeconds === 1 ? '' : 's'} before requesting a new code.`,
        };
      }

      const challenge = createOtpChallenge(norm.phone, now);
      state = {
        ...state,
        activeOtpChallenge: challenge,
      };
      notify();
      return { ok: true, code: challenge.code };
    },

    verifyPhoneOtp(code: string): { ok: boolean; isNewUser: boolean; error?: string } {
      if (!state.activeOtpChallenge) {
        return { ok: false, isNewUser: false, error: 'No active OTP verification. Please enter your mobile number.' };
      }
      const res = verifyOtpCode(state.activeOtpChallenge, code);
      if (!res.ok) {
        state = {
          ...state,
          activeOtpChallenge: res.updatedChallenge,
        };
        notify();
        return { ok: false, isNewUser: false, error: res.error };
      }

      const phone = state.activeOtpChallenge.phone;
      const existingUser = state.registeredUsers[phone];

      if (existingUser) {
        const verifiedUser: UserProfile = {
          ...existingUser,
          verifiedPhone: true,
        };
        const updatedRegistered = {
          ...state.registeredUsers,
          [phone]: verifiedUser,
        };
        state = {
          ...state,
          currentUser: verifiedUser,
          registeredUsers: updatedRegistered,
          activeOtpChallenge: null,
        };
        persistAuth(state.currentUser, state.registeredUsers);
        notify();
        return { ok: true, isNewUser: false };
      }

      state = {
        ...state,
        activeOtpChallenge: res.updatedChallenge,
      };
      notify();
      return { ok: true, isNewUser: true };
    },

    completeRegistration(name: string, nic?: string): { ok: boolean; error?: string } {
      if (!state.activeOtpChallenge || !state.activeOtpChallenge.isVerified) {
        return { ok: false, error: 'Phone number has not been verified.' };
      }
      const trimmedName = name.trim();
      if (trimmedName.length < 2) {
        return { ok: false, error: 'Please enter your full name.' };
      }

      let isNicValid = false;
      let cleanNic = '';
      if (nic && nic.trim()) {
        cleanNic = nic.trim().toUpperCase();
        const check = validateSriLankaNic(cleanNic);
        if (!check.valid) {
          return { ok: false, error: 'Please enter a valid Sri Lankan NIC (e.g. 199614502341 or 961452341V).' };
        }
        isNicValid = true;
      }

      const phone = state.activeOtpChallenge.phone;
      const newUser: UserProfile = {
        id: `usr-${Date.now()}`,
        name: trimmedName,
        email: '',
        phone,
        nicNumber: cleanNic,
        licenceNumber: '',
        verifiedPhone: true,
        verifiedNic: isNicValid,
        verifiedLicence: false,
        hasProfilePhoto: false,
        bio: 'Commuter on BlaBlaLanka.',
        completedRidesLast12Months: 0,
        overallRating: 5.0,
        ratingsCount: 0,
        drivingSkillScore: 3.0,
        cancellationRatePercent: 0,
        avgResponseHours: 1.0,
        defaultVehicle: '',
        comfort: {
          chattiness: 'blabla',
          maxTwoInBack: true,
          luggage: 'medium',
          music: 'yes',
          pets: 'no',
          smoking: 'no',
          womenOnly: false,
        },
      };

      const updatedRegistered = {
        ...state.registeredUsers,
        [phone]: newUser,
      };

      state = {
        ...state,
        currentUser: newUser,
        registeredUsers: updatedRegistered,
        activeOtpChallenge: null,
      };
      persistAuth(state.currentUser, state.registeredUsers);
      notify();
      return { ok: true };
    },

    logout(): void {
      state = {
        ...state,
        currentUser: null,
        activeOtpChallenge: null,
      };
      persistAuth(null, state.registeredUsers);
      notify();
    },

    updateUserVerification(input: {
      name: string;
      phone: string;
      nicNumber: string;
      licenceNumber: string;
      defaultVehicle: string;
      bio: string;
      comfort: ComfortProfile;
    }): { ok: boolean; error?: string } {
      if (!state.currentUser) {
        return { ok: false, error: 'You must be signed in to update verification details.' };
      }
      if (!validateSriLankaPhone(input.phone)) {
        return { ok: false, error: 'Enter a valid Sri Lankan mobile number (+947XXXXXXXX).' };
      }
      const nicCheck = validateSriLankaNic(input.nicNumber);
      if (!nicCheck.valid) {
        return {
          ok: false,
          error: 'Enter a valid Sri Lankan NIC (9 digits + V/X or 12 digits).',
        };
      }

      const updatedUser: UserProfile = {
        ...state.currentUser,
        name: input.name.trim(),
        phone: input.phone.trim(),
        nicNumber: input.nicNumber.trim().toUpperCase(),
        licenceNumber: input.licenceNumber.trim().toUpperCase(),
        defaultVehicle: input.defaultVehicle.trim(),
        bio: input.bio.trim(),
        verifiedPhone: true,
        verifiedNic: true,
        verifiedLicence: input.licenceNumber.trim().length >= 5,
        comfort: input.comfort,
      };

      const updatedRegistered = {
        ...state.registeredUsers,
        [updatedUser.phone]: updatedUser,
      };

      state = {
        ...state,
        currentUser: updatedUser,
        registeredUsers: updatedRegistered,
      };
      persistAuth(state.currentUser, state.registeredUsers);
      notify();
      return { ok: true };
    },
  };

  return store;
}

export type MarketplaceStore = ReturnType<typeof createMarketplaceStore>;
