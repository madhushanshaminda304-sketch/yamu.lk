import { type UserProfile, SEEDED_USERS } from './types.ts';

export const AUTH_STORAGE_KEY = 'blablacar_lk_auth_v1';

export function loadPersistedAuth(fallbackUser?: UserProfile): {
  currentUser: UserProfile | null;
  registeredUsers: Record<string, UserProfile>;
} {
  const fallback = fallbackUser ?? SEEDED_USERS['+94772345678'];
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          currentUser: 'currentUser' in parsed ? parsed.currentUser : fallback,
          registeredUsers: { ...SEEDED_USERS, ...(parsed.registeredUsers || {}) },
        };
      }
    }
  } catch {
    // fallback
  }
  return {
    currentUser: fallback,
    registeredUsers: { ...SEEDED_USERS },
  };
}

export function persistAuth(
  currentUser: UserProfile | null,
  registeredUsers: Record<string, UserProfile>
): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ currentUser, registeredUsers })
      );
    }
  } catch {
    // ignore
  }
}
