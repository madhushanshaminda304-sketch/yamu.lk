import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPersistedAuth, persistAuth } from '../src/state/persistence.ts';
import { SEEDED_USERS } from '../src/state/types.ts';

class LocalStorageMock {
  private store: Record<string, string> = {};
  getItem(key: string) {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }
  removeItem(key: string) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

test('auth persistence helpers - persists and restores authenticated user and registered user dictionary', () => {
  const mockStorage = new LocalStorageMock();
  (globalThis as unknown as { window?: { localStorage: LocalStorageMock } }).window = {
    localStorage: mockStorage,
  };

  const user = SEEDED_USERS['+94772345678'];
  persistAuth(user, { [user.id]: user });
  const restored = loadPersistedAuth(user);
  assert.equal(restored.currentUser?.id, user.id);
  assert.equal(restored.registeredUsers[user.id].name, 'Ashan Jayawardena');
});

test('auth persistence helpers - restores null currentUser when user logged out', () => {
  const mockStorage = new LocalStorageMock();
  (globalThis as unknown as { window?: { localStorage: LocalStorageMock } }).window = {
    localStorage: mockStorage,
  };

  persistAuth(null, {});
  const restored = loadPersistedAuth(SEEDED_USERS['+94772345678']);
  assert.equal(restored.currentUser, null);
});
