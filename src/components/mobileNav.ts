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
  unreadMessagesCount: number = 0
): MobileBadgeCounts {
  let yourRidesPendingCount = 0;
  if (currentUserName && Array.isArray(rides)) {
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
