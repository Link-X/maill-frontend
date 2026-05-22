import type { AuthState } from '../types';

export const createAuthStorage = (storageKey: string) => ({
  load: (): AuthState => {
    if (typeof localStorage === 'undefined') return { token: null, user: null };
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return { token: null, user: null };
      const parsed = JSON.parse(raw) as AuthState;
      return { token: parsed.token ?? null, user: parsed.user ?? null };
    } catch {
      return { token: null, user: null };
    }
  },
  save: (state: AuthState) => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(storageKey, JSON.stringify(state));
  },
  clear: () => {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(storageKey);
  },
});
