import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQuery } from '@maill/shared';
import type { AuthResponse, LoginRequest, RegisterRequest } from '@maill/shared';
import { logout } from './authSlice';

type AppStoreLike = {
  getState: () => { auth: { token: string | null } };
  dispatch: (action: unknown) => unknown;
};

const getStore = (): AppStoreLike | null =>
  (window as unknown as { __store?: AppStoreLike }).__store ?? null;

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: createBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE,
    getToken: () => getStore()?.getState().auth.token ?? null,
    onUnauthorized: () => getStore()?.dispatch(logout()),
  }),
  endpoints: (build) => ({
    login: build.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({ url: '/api/auth/login', method: 'POST', body }),
    }),
    register: build.mutation<AuthResponse, RegisterRequest>({
      query: (body) => ({ url: '/api/auth/register', method: 'POST', body }),
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation } = authApi;
