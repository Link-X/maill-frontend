import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQuery } from '@maill/shared';
import type { AuthResponse, LoginRequest } from '@maill/shared';
import { logout } from './adminAuthSlice';

type AdminStoreLike = {
  getState: () => { adminAuth: { token: string | null } };
  dispatch: (action: unknown) => unknown;
};

const getStore = (): AdminStoreLike | null =>
  (window as unknown as { __store?: AdminStoreLike }).__store ?? null;

export const adminAuthApi = createApi({
  reducerPath: 'adminAuthApi',
  baseQuery: createBaseQuery({
    baseUrl: import.meta.env.VITE_AUTH_BASE,
    getToken: () => getStore()?.getState().adminAuth.token ?? null,
    onUnauthorized: () => getStore()?.dispatch(logout()),
  }),
  endpoints: (build) => ({
    login: build.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({ url: '/api/auth/login', method: 'POST', body }),
    }),
  }),
});

export const { useLoginMutation } = adminAuthApi;
