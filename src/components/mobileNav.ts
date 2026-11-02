export interface MobileBadgeCounts {
  yourRidesPendingCount: number;
  inboxUnreadCount: number;
}

/**
 * Computes pending booking requests count for driver's rides
 * and unread messages count for the Inbox.
 */
export function computeMobileBadges(
  rides: any[] = [],
  currentUserName: string = '',
  unreadMessagesCount: number = 0,
  bookings: any[] = []
): MobileBadgeCounts {
  let yourRidesPendingCount = 0;
  if (currentUserName && Array.isArray(rides)) {
    if (Array.isArray(bookings) && bookings.length > 0) {
      const driverRideIds = new Set(
        rides.filter((r) => r?.driver?.name === currentUserName).map((r) => r.id)
      );
      for (const booking of bookings) {
        if (booking?.status === 'pending' && driverRideIds.has(booking.rideId)) {
          yourRidesPendingCount++;
        }
      }
    } else {
      for (const ride of rides) {
        if (ride?.driver?.name === currentUserName && Array.isArray(ride?.bookings)) {
          for (const booking of ride.bookings) {
            if (booking?.status === 'pending') {
              yourRidesPendingCount++;
            }
          }
        }
      }
    }
  }

  const inboxUnreadCount =
    typeof unreadMessagesCount === 'number' && unreadMessagesCount > 0
      ? unreadMessagesCount
      : 0;

  return {
    yourRidesPendingCount,
    inboxUnreadCount,
  };
}

export function isTabActive(currentPath: string, matchPaths: string[]): boolean {
  const normalized = currentPath.toLowerCase();
  return matchPaths.some((target) => {
    if (target === '/') {
      return normalized === '/' || normalized === '';
    }
    return normalized === target || normalized.startsWith(target + '/') || normalized.startsWith(target + '?');
  });
}
