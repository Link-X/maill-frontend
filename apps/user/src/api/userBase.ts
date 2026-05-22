import { createBaseQuery } from '@maill/shared';

type UserStoreLike = {
  getState: () => { auth: { token: string | null } };
  dispatch: (action: unknown) => unknown;
};

const getStore = (): UserStoreLike | null =>
  (window as unknown as { __store?: UserStoreLike }).__store ?? null;

export const userBaseQuery = createBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE,
  getToken: () => getStore()?.getState().auth.token ?? null,
  onUnauthorized: () => {
    const store = getStore();
    if (!store) return;
    store.dispatch({ type: 'auth/logout' });
  },
});
