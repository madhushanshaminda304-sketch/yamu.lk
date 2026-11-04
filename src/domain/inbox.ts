import { getHubById, getHubDisplayName } from './corridors.ts';
import { type LocaleCode } from './i18n.ts';
import type { Ride } from './matching.ts';
import type { BookingRecord, ChatMessage } from '../state/types.ts';

export interface ConversationThread {
  bookingId: string;
  rideId: string;
  booking?: BookingRecord;
  ride?: Ride;
  counterpartName: string;
  counterpartRole: 'driver' | 'passenger';
  isDriverSuperDriver?: boolean;
  isDriverVerified?: boolean;
  counterpartPhone?: string;
  corridorTitle: string;
  departureDate?: string;
  departureAt?: string;
  lastMessage: string;
  lastSentAt: string;
  unreadCount: number;
  messages: ChatMessage[];
}

/**
 * Formats an ISO timestamp to human-friendly relative time for mobile threads.
 */
export function formatRelativeTime(timestamp: string, locale: LocaleCode = 'en-LK'): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return timestamp;

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (locale !== 'en-LK' && diffDays < 7) {
    const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    if (diffMins < 1) return relative.format(0, 'second');
    if (diffMins < 60) return relative.format(-diffMins, 'minute');
    if (diffHours < 24) return relative.format(-diffHours, 'hour');
    return relative.format(-diffDays, 'day');
  }

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

/**
 * Computes unread messages count across all threads based on store's lastReadAtByBooking map.
 */
export function computeUnreadMessagesCount(
  messages: any[] = [],
  lastReadAtByBooking: Record<string, string> = {},
  currentUserId?: string,
  currentUserName?: string
): number {
  if (!Array.isArray(messages) || (!currentUserId && !currentUserName)) return 0;
  return messages.filter((m) => {
    const isMe =
      (currentUserId && m.senderId === currentUserId) ||
      (currentUserName && m.senderName === currentUserName);
    if (isMe) return false;
    const lastRead = lastReadAtByBooking[m.bookingId] ?? '';
    const msgTime = m.sentAt || m.createdAt || '';
    return !lastRead || msgTime > lastRead;
  }).length;
}

/**
 * Groups messages by bookingId, associates ride & booking details,
 * computes counterpart identity, and sorts threads by lastSentAt descending.
 */
export function aggregateInboxThreads(
  messages: any[] = [],
  rides: any[] = [],
  bookings: any[] = [],
  currentUserName?: string,
  lastReadAtByBooking: Record<string, string> = {},
  currentUserId?: string,
  locale: LocaleCode = 'en-LK'
): ConversationThread[] {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  const messagesByBooking = new Map<string, any[]>();
  for (const msg of messages) {
    if (!msg || !msg.bookingId) continue;
    const list = messagesByBooking.get(msg.bookingId) ?? [];
    list.push(msg);
    messagesByBooking.set(msg.bookingId, list);
  }

  const threads: ConversationThread[] = [];

  for (const [bookingId, msgs] of messagesByBooking.entries()) {
    // Sort msgs chronologically
    const sorted = [...msgs].sort((a, b) => {
      const timeA = a.sentAt || a.createdAt || '';
      const timeB = b.sentAt || b.createdAt || '';
      return timeA.localeCompare(timeB);
    });

    const latestMsg = sorted[sorted.length - 1];
    const lastSentAt = latestMsg?.sentAt || latestMsg?.createdAt || '';
    const lastMessage = latestMsg?.body || latestMsg?.text || '';

    // Find booking
    let booking: any = Array.isArray(bookings)
      ? bookings.find((b: any) => b?.id === bookingId)
      : undefined;

    if (!booking && Array.isArray(rides)) {
      for (const r of rides) {
        if (Array.isArray(r.bookings)) {
          const match = r.bookings.find((bk: any) => bk?.id === bookingId);
          if (match) {
            booking = match;
            break;
          }
        }
      }
    }

    // Find ride
    const rideId = booking?.rideId || '';
    let ride: any = Array.isArray(rides)
      ? rides.find((r: any) => r?.id === rideId)
      : undefined;

    if (!ride && Array.isArray(rides)) {
      ride = rides.find(
        (r: any) =>
          Array.isArray(r.bookings) && r.bookings.some((bk: any) => bk?.id === bookingId)
      );
    }

    // Counterpart details
    const passengerName = booking?.passengerName || '';
    const passengerPhone = booking?.passengerPhone || '';
    const driverName =
      ride?.driver?.name || (typeof ride?.driver === 'string' ? ride.driver : '');
    const driverPhone = ride?.driver?.phone || '';
    const isSuperDriver = Boolean(ride?.driver?.isSuperDriver);
    const isDriverVerified = Boolean(
      ride?.driver?.verifiedPhone || ride?.driver?.verifiedNic
    );

    const normalizedUser = currentUserName ? currentUserName.trim().toLowerCase() : '';
    const isPassenger =
      (Boolean(passengerName) && normalizedUser === passengerName.trim().toLowerCase()) ||
      (Boolean(currentUserId) && booking?.passengerId === currentUserId);
    const isDriver =
      (Boolean(driverName) && normalizedUser === driverName.trim().toLowerCase()) ||
      (Boolean(currentUserId) &&
        (ride?.driverId === currentUserId || ride?.driver?.id === currentUserId));
    const isMessageSender = currentUserId
      ? sorted.some((m) => m.senderId === currentUserId)
      : currentUserName
        ? sorted.some((m) => m.senderName?.trim().toLowerCase() === normalizedUser)
        : false;

    // Privacy protection: If authenticated user is provided, only include threads they belong to
    if (currentUserName || currentUserId) {
      if (!isPassenger && !isDriver && !isMessageSender) {
        continue;
      }
    }

    let counterpartName = 'Travel Partner';
    let counterpartRole: 'driver' | 'passenger' = 'passenger';
    let counterpartPhone = '';

    if (isPassenger) {
      counterpartName = driverName || 'Driver';
      counterpartRole = 'driver';
      counterpartPhone = driverPhone;
    } else if (isDriver) {
      counterpartName = passengerName || 'Passenger';
      counterpartRole = 'passenger';
      counterpartPhone = passengerPhone;
    } else if (passengerName) {
      counterpartName = passengerName;
      counterpartRole = 'passenger';
      counterpartPhone = passengerPhone;
    } else if (driverName) {
      counterpartName = driverName;
      counterpartRole = 'driver';
      counterpartPhone = driverPhone;
    }

    // Corridor title
    const originId = booking?.fromHubId || ride?.originHubId || '';
    const destId = booking?.toHubId || ride?.destinationHubId || '';
    const originHub = originId ? getHubById(originId) : undefined;
    const destHub = destId ? getHubById(destId) : undefined;
    const originName = getHubDisplayName(originHub, locale) || originId;
    const destName = getHubDisplayName(destHub, locale) || destId;

    let corridorTitle = 'Ride Coordination';
    if (originName && destName) {
      corridorTitle = `${originName} → ${destName}`;
    } else if (ride?.corridorName) {
      corridorTitle = ride.corridorName;
    }

    // Unread count
    const lastRead = lastReadAtByBooking[bookingId] ?? '';
    let unreadCount = 0;
    for (const m of sorted) {
      const isMe =
        (currentUserId && m.senderId === currentUserId) ||
        (currentUserName && m.senderName === currentUserName);
      if (!isMe) {
        const msgTime = m.sentAt || m.createdAt || '';
        if (!lastRead || msgTime > lastRead) {
          unreadCount++;
        }
      }
    }

    threads.push({
      bookingId,
      rideId: ride?.id || rideId,
      booking,
      ride,
      counterpartName,
      counterpartRole,
      isDriverSuperDriver: counterpartRole === 'driver' ? isSuperDriver : undefined,
      isDriverVerified: counterpartRole === 'driver' ? isDriverVerified : undefined,
      counterpartPhone,
      corridorTitle,
      departureDate:
        ride?.departureDate ||
        (ride?.departureAt ? ride.departureAt.split('T')[0] : undefined),
      departureAt: ride?.departureAt,
      lastMessage,
      lastSentAt,
      unreadCount,
      messages: sorted,
    });
  }

  // Sort threads descending by lastSentAt
  threads.sort((a, b) => (b.lastSentAt || '').localeCompare(a.lastSentAt || ''));

  return threads;
}
