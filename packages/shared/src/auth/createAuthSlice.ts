import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, User } from '../types';
import { createAuthStorage } from './storage';

export interface CreateAuthSliceOptions {
  name: string;        // 'auth' 或 'adminAuth'
  storageKey: string;  // localStorage key
}

export const createAuthSlice = (options: CreateAuthSliceOptions) => {
  const storage = createAuthStorage(options.storageKey);

  const slice = createSlice({
    name: options.name,
    initialState: storage.load(),
    reducers: {
      setCredentials: (state, action: PayloadAction<{ token: string; user: User }>) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        storage.save(state);
      },
      logout: (state) => {
        state.token = null;
        state.user = null;
        storage.clear();
      },
    },
  });

  // 用 unknown 兜底类型：每个 app 自己的 store 类型推断时再精化
  const pick = (root: unknown): AuthState | undefined =>
    (root as Record<string, AuthState>)[options.name];

  const selectToken = (root: unknown) => pick(root)?.token ?? null;
  const selectUser = (root: unknown) => pick(root)?.user ?? null;
  const selectIsAuthenticated = (root: unknown) => !!pick(root)?.token;

  return {
    slice,
    actions: slice.actions,
    reducer: slice.reducer,
    selectors: { selectToken, selectUser, selectIsAuthenticated },
    storage,
  };
};
