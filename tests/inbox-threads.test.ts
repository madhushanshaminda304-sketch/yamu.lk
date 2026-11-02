import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { aggregateInboxThreads, formatRelativeTime } from '../src/domain/inbox.ts';
import { createMarketplaceStore } from '../src/state/store.ts';

describe('Inbox Thread Aggregation & State', () => {
  it('groups messages by booking and sorts by latest sent time descending', () => {
    const messages = [
      { id: 'm1', bookingId: 'b1', body: 'Are you at Makumbura?', sentAt: '2026-11-02T08:00:00Z', senderRole: 'passenger' },
      { id: 'm2', bookingId: 'b2', body: 'Leaving Kandy now', sentAt: '2026-11-02T09:00:00Z', senderRole: 'driver' },
      { id: 'm3', bookingId: 'b1', body: 'Yes, near the expressway entrance', sentAt: '2026-11-02T08:15:00Z', senderRole: 'driver' },
    ];
    const rides = [
      { id: 'r1', originHubId: 'makumbura', destinationHubId: 'galle', bookings: [{ id: 'b1', passengerName: 'Kamal' }] },
      { id: 'r2', originHubId: 'kandy', destinationHubId: 'colombo', bookings: [{ id: 'b2', passengerName: 'Nimal' }] },
    ];

    const threads = aggregateInboxThreads(messages as any, rides as any);
    assert.equal(threads.length, 2);
    // Thread b2 latest is 09:00:00Z, b1 latest is 08:15:00Z -> b2 comes first
    assert.equal(threads[0].bookingId, 'b2', 'Most recent conversation thread should be first');
    assert.equal(threads[0].lastMessage, 'Leaving Kandy now');
    assert.equal(threads[0].lastSentAt, '2026-11-02T09:00:00Z');
    assert.equal(threads[0].counterpartName, 'Nimal');
    assert.match(threads[0].corridorTitle, /Kandy.*Colombo/);

    assert.equal(threads[1].bookingId, 'b1');
    assert.equal(threads[1].lastMessage, 'Yes, near the expressway entrance');
    assert.equal(threads[1].lastSentAt, '2026-11-02T08:15:00Z');
    assert.equal(threads[1].counterpartName, 'Kamal');
    assert.match(threads[1].corridorTitle, /Makumbura.*Galle/);
  });

  it('handles empty message lists cleanly returning an empty array', () => {
    const threads = aggregateInboxThreads([], []);
    assert.deepEqual(threads, []);

    const threadsUndefined = aggregateInboxThreads(undefined as any, undefined as any);
    assert.deepEqual(threadsUndefined, []);
  });

  it('computes counterpart and role correctly for driver viewing passenger thread', () => {
    const messages = [
      {
        id: 'msg-1',
        bookingId: 'bk-100',
        senderId: 'usr-passenger',
        senderName: 'Dilshan Silva',
        text: 'Will be at Kottawa exit in 5 mins',
        createdAt: '2026-11-02T10:00:00Z',
      },
    ];
    const rides = [
      {
        id: 'ride-1',
        driverId: 'usr-ashan',
        driver: {
          id: 'usr-ashan',
          name: 'Ashan Jayawardena',
          isSuperDriver: true,
          verifiedPhone: true,
          phone: '+94772345678',
        },
        originHubId: 'makumbura',
        destinationHubId: 'galle',
      },
    ];
    const bookings = [
      {
        id: 'bk-100',
        rideId: 'ride-1',
        passengerId: 'usr-passenger',
        passengerName: 'Dilshan Silva',
        passengerPhone: '+94712345678',
        fromHubId: 'makumbura',
        toHubId: 'galle',
      },
    ];

    // Current user is driver Ashan
    const driverThreads = aggregateInboxThreads(messages as any, rides as any, bookings as any, 'Ashan Jayawardena');
    assert.equal(driverThreads.length, 1);
    assert.equal(driverThreads[0].counterpartName, 'Dilshan Silva');
    assert.equal(driverThreads[0].counterpartRole, 'passenger');
    assert.equal(driverThreads[0].counterpartPhone, '+94712345678');

    // Current user is passenger Dilshan
    const passengerThreads = aggregateInboxThreads(messages as any, rides as any, bookings as any, 'Dilshan Silva');
    assert.equal(passengerThreads.length, 1);
    assert.equal(passengerThreads[0].counterpartName, 'Ashan Jayawardena');
    assert.equal(passengerThreads[0].counterpartRole, 'driver');
    assert.equal(passengerThreads[0].isDriverSuperDriver, true);
    assert.equal(passengerThreads[0].isDriverVerified, true);
    assert.equal(passengerThreads[0].counterpartPhone, '+94772345678');
  });

  it('tracks unread messages and markConversationRead updates read state', () => {
    const store = createMarketplaceStore();
    const state0 = store.getState();
    assert.deepEqual(state0.lastReadAtByBooking, {});

    // Mark booking read
    store.markConversationRead('bk-100');
    const state1 = store.getState();
    assert.ok(state1.lastReadAtByBooking['bk-100']);
    const readTimestamp = state1.lastReadAtByBooking['bk-100'];

    // If a new message arrived before read timestamp, it is not unread
    const messages = [
      {
        id: 'msg-1',
        bookingId: 'bk-100',
        senderId: 'usr-passenger',
        senderName: 'Dilshan Silva',
        text: 'Old message',
        createdAt: '2026-11-01T10:00:00Z',
      },
      {
        id: 'msg-2',
        bookingId: 'bk-100',
        senderId: 'usr-passenger',
        senderName: 'Dilshan Silva',
        text: 'Brand new unread message',
        createdAt: new Date(Date.now() + 60000).toISOString(),
      },
    ];
    const rides = [
      {
        id: 'ride-1',
        driverId: 'usr-ashan',
        driver: { id: 'usr-ashan', name: 'Ashan Jayawardena' },
        originHubId: 'makumbura',
        destinationHubId: 'galle',
      },
    ];
    const bookings = [
      {
        id: 'bk-100',
        rideId: 'ride-1',
        passengerId: 'usr-passenger',
        passengerName: 'Dilshan Silva',
        fromHubId: 'makumbura',
        toHubId: 'galle',
      },
    ];

    const threads = aggregateInboxThreads(
      messages as any,
      rides as any,
      bookings as any,
      'Ashan Jayawardena',
      { 'bk-100': '2026-11-02T00:00:00Z' },
      'usr-ashan'
    );
    assert.equal(threads[0].unreadCount, 1);
    assert.equal(threads[0].lastMessage, 'Brand new unread message');
  });

  it('formats relative timestamps cleanly', () => {
    assert.equal(formatRelativeTime(''), '');
    assert.equal(formatRelativeTime('invalid-date'), 'invalid-date');

    const justNow = new Date().toISOString();
    assert.equal(formatRelativeTime(justNow), 'Just now');

    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    assert.equal(formatRelativeTime(tenMinsAgo), '10m ago');

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    assert.equal(formatRelativeTime(twoHoursAgo), '2h ago');
  });

  it('handles messages with missing booking gracefully', () => {
    const orphanMessages = [
      { id: 'm-orphan', bookingId: 'bk-nonexistent', body: 'Where are you?', sentAt: '2026-11-02T12:00:00Z' }
    ];
    const threads = aggregateInboxThreads(orphanMessages as any, []);
    assert.equal(threads.length, 1);
    assert.equal(threads[0].bookingId, 'bk-nonexistent');
    assert.equal(threads[0].lastMessage, 'Where are you?');
    assert.equal(threads[0].counterpartName, 'Travel Partner');
    assert.equal(threads[0].corridorTitle, 'Ride Coordination');
  });

  it('filters out private conversation threads from unrelated third-party users', () => {
    const messages = [
      { id: 'm1', bookingId: 'bk-private', body: 'Secret ride details', sentAt: '2026-11-02T10:00:00Z', senderId: 'u-alice', senderName: 'Alice' }
    ];
    const rides = [
      { id: 'r1', driverId: 'u-alice', driver: { id: 'u-alice', name: 'Alice' } }
    ];
    const bookings = [
      { id: 'bk-private', rideId: 'r1', passengerId: 'u-bob', passengerName: 'Bob' }
    ];

    // Alice sees the thread
    const aliceThreads = aggregateInboxThreads(messages as any, rides as any, bookings as any, 'Alice', {}, 'u-alice');
    assert.equal(aliceThreads.length, 1);

    // Bob sees the thread
    const bobThreads = aggregateInboxThreads(messages as any, rides as any, bookings as any, 'Bob', {}, 'u-bob');
    assert.equal(bobThreads.length, 1);

    // Unrelated user Eve must NOT see the thread
    const eveThreads = aggregateInboxThreads(messages as any, rides as any, bookings as any, 'Eve', {}, 'u-eve');
    assert.equal(eveThreads.length, 0, 'Eve must not see private conversation between Alice and Bob');
  });
});
