import { createBaseQuery } from '@maill/shared';

type AdminStoreLike = {
  getState: () => { adminAuth: { token: string | null } };
  dispatch: (action: unknown) => unknown;
};

const getStore = (): AdminStoreLike | null =>
  (window as unknown as { __store?: AdminStoreLike }).__store ?? null;

export const adminBaseQuery = createBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE,
  getToken: () => getStore()?.getState().adminAuth.token ?? null,
  onUnauthorized: () => {
    const store = getStore();
    if (!store) return;
    store.dispatch({ type: 'adminAuth/logout' });
  },
});
