import { useSyncExternalStore } from 'react';
import { getHubById } from '../domain/corridors.ts';
import { type TollPolicy } from '../domain/pricing.ts';
import {
  type Ride,
  type RideStop,
  type ComfortProfile,
  type ApprovalMode,
  type VehicleCategory,
  canBookLeg,
  applyLegBooking,
  releaseLegBooking,
  deduplicateRides,
} from '../domain/matching.ts';
import {
  type DoubleBlindRating,
  type DrivingSkillLabel,
  validateSriLankaPhone,
  validateSriLankaNic,
  resolveRatingVisibility,
} from '../domain/trust.ts';
import { inspectChatMessage, type ChatInspectionResult } from '../domain/scamGuard.ts';
import { getColomboDateOffset, getValidLocale, type LocaleCode } from '../domain/i18n.ts';
import {
  type OtpChallenge,
  normalizeSriLankanMobile,
  createOtpChallenge,
  verifyOtpCode,
} from '../domain/auth.ts';
import {
  SEEDED_PASSENGER_REQUESTS,
  createPassengerRequest,
  type PassengerRideRequest,
} from '../domain/passengerRequests.ts';
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
  type LuggageCapacity,
  type Booking,
  type TrustedContact,
  type SavedPlace,
  SEEDED_USERS,
} from './types.ts';
import { loadPersistedAuth, persistAuth } from './persistence.ts';
import { addMinutesIso, buildReturnRide, buildOutboundRide } from './rideBuilder.ts';
import { persistRemoteRide, persistRemoteBooking } from './supabaseSync.ts';
import {
  createDefaultUserProfile,
  buildUpdatedUserProfile,
  addContactToUser,
  removeContactFromUser,
  savePlaceToUser,
  removePlaceFromUser,
  applyUserUpdate,
} from './userHelpers.ts';

export { buildSeededRides, SEEDED_USERS };
export type {
  SettlementMethod, BookingRecord, Booking, RideAlertSubscription,
  ChatMessage, AppNotification, UserProfile, PublishRideInput,
  MarketplaceState, LuggageCapacity,
};

export function createInitialState(): MarketplaceState {
  const tomorrow = getColomboDateOffset(1);
  const auth = loadPersistedAuth();
  let initialLocale: LocaleCode = 'en-LK';
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      initialLocale = getValidLocale(window.localStorage.getItem('yamo_locale'));
    } catch {
      // localStorage may fail in restricted sandboxes
    }
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = initialLocale.slice(0, 2);
  }
  return {
    locale: initialLocale,
    currentUser: auth.currentUser,
    registeredUsers: auth.registeredUsers,
    activeOtpChallenge: null,
    rides: deduplicateRides(buildSeededRides(tomorrow)),
    bookings: [],
    rideAlerts: [],
    messages: [],
    ratings: [],
    notifications: [{
      id: 'notif-welcome',
      title: 'Welcome to Yamo (Sri Lanka)',
      body: 'Your Sri Lankan NIC and +94 mobile number are verified. You hold Super Driver status.',
      createdAt: new Date().toISOString(),
    }],
    passengerRequests: [...SEEDED_PASSENGER_REQUESTS],
    lastReadAtByBooking: {},
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

    setState(updater: Partial<MarketplaceState> | ((prev: MarketplaceState) => Partial<MarketplaceState>)): void {
      const patch = typeof updater === 'function' ? updater(state) : updater;
      state = { ...state, ...patch };
      notify();
    },

    setLocale(locale: LocaleCode): void {
      const valid = getValidLocale(locale);
      state = { ...state, locale: valid };
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem('yamo_locale', valid);
        } catch {
          // ignore localStorage errors
        }
      }
      if (typeof document !== 'undefined') {
        document.documentElement.lang = valid.slice(0, 2);
      }
      notify();
    },

    setRides(rides: Ride[]): void {
      state = { ...state, rides: deduplicateRides(rides) };
      notify();
    },

    publishRide(input: PublishRideInput): Ride {
      if (!state.currentUser) {
        throw new Error('You must be signed in to publish a ride.');
      }
      const currentUser = state.currentUser;
      const { newRide, clampedPriceLkr, recommendedLkr } = buildOutboundRide(input, currentUser);

      let returnRide: Ride | undefined;
      if (input.returnTripEnabled) {
        returnRide = buildReturnRide(input, newRide, currentUser, clampedPriceLkr, recommendedLkr);
        newRide.returnRideId = returnRide.id;
        returnRide.returnRideId = newRide.id;
      }

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

      const newRidesToAdd = returnRide ? [newRide, returnRide] : [newRide];
      state = {
        ...state,
        rides: deduplicateRides([...newRidesToAdd, ...state.rides]),
        notifications: [...triggeredNotifications, ...state.notifications],
      };
      notify();
      for (const r of newRidesToAdd) {
        persistRemoteRide(r).catch(() => {});
      }
      return newRide;
    },

    bookRideLeg(input: {
      rideId: string;
      fromHubId: string;
      toHubId: string;
      seats: number;
      settlementMethod: SettlementMethod;
      message: string;
      isBookingForOther?: boolean;
      guestPassengerName?: string;
      guestPassengerPhone?: string;
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

      const isForOther = Boolean(input.isBookingForOther && input.guestPassengerName?.trim());
      const guestName = input.guestPassengerName?.trim();
      const guestPhone = input.guestPassengerPhone?.trim();

      const booking: BookingRecord = {
        id: `bk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        rideId: ride.id,
        passengerId: currentUser.id,
        passengerName: isForOther && guestName ? guestName : currentUser.name,
        passengerPhone: isForOther && guestPhone ? guestPhone : currentUser.phone,
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
        isBookingForOther: isForOther || undefined,
        bookerName: isForOther ? currentUser.name : undefined,
        bookerPhone: isForOther ? currentUser.phone : undefined,
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
      persistRemoteBooking(booking).catch(() => {});
      persistRemoteRide(nextRide).catch(() => {});
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

    updateRideJourneyStatus(
      rideId: string,
      status: 'scheduled' | 'departed' | 'completed'
    ): { success: boolean; error?: string } {
      const ride = state.rides.find((r) => r.id === rideId);
      if (!ride) return { success: false, error: 'Ride not found.' };

      const updatedRide: Ride = { ...ride, journeyStatus: status };
      const statusTitle =
        status === 'departed' ? 'Driver En Route' : status === 'completed' ? 'Trip Completed' : 'Trip Scheduled';

      const newNotif: AppNotification = {
        id: `notif-js-${Date.now()}`,
        title: `${statusTitle}: ${ride.corridorName}`,
        body:
          status === 'departed'
            ? `Driver ${ride.driver.name} is now en route. Boarding passes have been activated.`
            : `Ride on ${ride.corridorName} is now marked ${status}.`,
        createdAt: new Date().toISOString(),
      };

      state = {
        ...state,
        rides: state.rides.map((r) => (r.id === rideId ? updatedRide : r)),
        notifications: [newNotif, ...state.notifications],
      };
      notify();
      persistRemoteRide(updatedRide).catch(() => {});
      return { success: true };
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

    postPassengerRequest(input: Parameters<typeof createPassengerRequest>[0]): PassengerRideRequest {
      const req = createPassengerRequest(input);
      state = {
        ...state,
        passengerRequests: [req, ...state.passengerRequests],
      };
      notify();
      return req;
    },

    offerSeatToPassengerRequest(requestId: string): void {
      state = {
        ...state,
        passengerRequests: state.passengerRequests.map((r) =>
          r.id === requestId ? { ...r, status: 'matched' as const } : r
        ),
      };
      notify();
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

    markConversationRead(bookingId: string, timestamp?: string): void {
      const readAt = timestamp ?? new Date().toISOString();
      state = {
        ...state,
        lastReadAtByBooking: {
          ...state.lastReadAtByBooking,
          [bookingId]: readAt,
        },
      };
      notify();
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
      const newUser = createDefaultUserProfile({
        id: `usr-${Date.now()}`,
        name: trimmedName,
        phone,
        nicNumber: cleanNic,
        isNicValid,
      });

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

      const updatedUser = buildUpdatedUserProfile(state.currentUser, input);
      state = { ...state, ...applyUserUpdate(state.registeredUsers, updatedUser) };
      persistAuth(state.currentUser, state.registeredUsers);
      notify();
      return { ok: true };
    },

    addTrustedContact(contact: TrustedContact): void {
      if (!state.currentUser) return;
      const updatedUser = addContactToUser(state.currentUser, contact);
      state = { ...state, ...applyUserUpdate(state.registeredUsers, updatedUser) };
      persistAuth(state.currentUser, state.registeredUsers);
      notify();
    },

    removeTrustedContact(contactId: string): void {
      if (!state.currentUser) return;
      const updatedUser = removeContactFromUser(state.currentUser, contactId);
      state = { ...state, ...applyUserUpdate(state.registeredUsers, updatedUser) };
      persistAuth(state.currentUser, state.registeredUsers);
      notify();
    },

    saveFavoritePlace(place: SavedPlace): void {
      if (!state.currentUser) return;
      const updatedUser = savePlaceToUser(state.currentUser, place);
      state = { ...state, ...applyUserUpdate(state.registeredUsers, updatedUser) };
      persistAuth(state.currentUser, state.registeredUsers);
      notify();
    },

    removeFavoritePlace(placeId: string): void {
      if (!state.currentUser) return;
      const updatedUser = removePlaceFromUser(state.currentUser, placeId);
      state = { ...state, ...applyUserUpdate(state.registeredUsers, updatedUser) };
      persistAuth(state.currentUser, state.registeredUsers);
      notify();
    },
  };

  return store;
}

export type MarketplaceStore = ReturnType<typeof createMarketplaceStore>;

export const defaultMarketplaceStore = createMarketplaceStore();

export function useMarketplaceStore<T = MarketplaceState>(
  selector?: (state: MarketplaceState) => T
): T {
  const state = useSyncExternalStore(
    defaultMarketplaceStore.subscribe,
    defaultMarketplaceStore.getState
  );
  return selector ? selector(state) : (state as unknown as T);
}

useMarketplaceStore.getState = defaultMarketplaceStore.getState;
useMarketplaceStore.subscribe = defaultMarketplaceStore.subscribe;
useMarketplaceStore.setState = defaultMarketplaceStore.setState;
