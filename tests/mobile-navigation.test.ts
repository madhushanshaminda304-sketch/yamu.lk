import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeMobileBadges, isTabActive } from '../src/components/mobileNav.ts';

describe('Mobile Bottom Navigation Badges', () => {
  it('calculates pending booking requests for driver rides', () => {
    const rides = [
      { id: 'r1', driver: { name: 'Saman' }, bookings: [{ status: 'pending' }, { status: 'confirmed' }] },
      { id: 'r2', driver: { name: 'Other' }, bookings: [{ status: 'pending' }] }
    ];
    const badges = computeMobileBadges(rides as any, 'Saman', 2);
    assert.equal(badges.yourRidesPendingCount, 1);
    assert.equal(badges.inboxUnreadCount, 2);
  });

  it('handles multiple pending bookings across multiple driver rides', () => {
    const rides = [
      {
        id: 'r1',
        driver: { name: 'Kasun Perera' },
        bookings: [{ status: 'pending' }, { status: 'pending' }, { status: 'confirmed' }]
      },
      {
        id: 'r2',
        driver: { name: 'Kasun Perera' },
        bookings: [{ status: 'pending' }, { status: 'rejected' }]
      },
      {
        id: 'r3',
        driver: { name: 'Nimal' },
        bookings: [{ status: 'pending' }]
      }
    ];
    const badges = computeMobileBadges(rides as any, 'Kasun Perera', 5);
    assert.equal(badges.yourRidesPendingCount, 3);
    assert.equal(badges.inboxUnreadCount, 5);
  });

  it('returns zero pending count when no current user or user has no rides', () => {
    const rides = [
      { id: 'r1', driver: { name: 'Saman' }, bookings: [{ status: 'pending' }] }
    ];
    const badgesNull = computeMobileBadges(rides as any, '', 0);
    assert.equal(badgesNull.yourRidesPendingCount, 0);
    assert.equal(badgesNull.inboxUnreadCount, 0);

    const badgesNotFound = computeMobileBadges(rides as any, 'Unknown User', 1);
    assert.equal(badgesNotFound.yourRidesPendingCount, 0);
    assert.equal(badgesNotFound.inboxUnreadCount, 1);
  });

  it('handles empty rides or rides with undefined bookings gracefully', () => {
    const rides = [
      { id: 'r1', driver: { name: 'Saman' } },
      { id: 'r2', driver: null }
    ];
    const badges = computeMobileBadges(rides as any, 'Saman', 0);
    assert.equal(badges.yourRidesPendingCount, 0);
    assert.equal(badges.inboxUnreadCount, 0);
  });

  it('calculates pending bookings from top-level store bookings matching driver rides', () => {
    const rides = [
      { id: 'r1', driver: { name: 'Sunil Perera' } },
      { id: 'r2', driver: { name: 'Other Driver' } }
    ];
    const bookings = [
      { id: 'b1', rideId: 'r1', status: 'pending' },
      { id: 'b2', rideId: 'r1', status: 'confirmed' },
      { id: 'b3', rideId: 'r2', status: 'pending' },
      { id: 'b4', rideId: 'r1', status: 'pending' }
    ];
    const badges = computeMobileBadges(rides as any, 'Sunil Perera', 3, bookings as any);
    assert.equal(badges.yourRidesPendingCount, 2, 'Should count 2 pending bookings for Sunil');
    assert.equal(badges.inboxUnreadCount, 3);
  });
});

describe('Mobile Tab Active Route Matching', () => {
  it('correctly identifies root and search paths', () => {
    assert.equal(isTabActive('/', ['/', '/search']), true);
    assert.equal(isTabActive('/search', ['/', '/search']), true);
    assert.equal(isTabActive('/search?from=colombo', ['/', '/search']), true);
    assert.equal(isTabActive('/publish', ['/', '/search']), false);
  });

  it('correctly matches publish, your-rides, inbox, and profile routes', () => {
    assert.equal(isTabActive('/publish', ['/publish']), true);
    assert.equal(isTabActive('/your-rides', ['/your-rides', '/rides']), true);
    assert.equal(isTabActive('/rides', ['/your-rides', '/rides']), true);
    assert.equal(isTabActive('/inbox', ['/inbox']), true);
    assert.equal(isTabActive('/profile', ['/profile']), true);
    assert.equal(isTabActive('/profile/edit', ['/profile']), true);
  });
});
