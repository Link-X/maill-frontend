import { configureStore } from '@reduxjs/toolkit';
import { themeSlice, localeSlice } from '@maill/shared';
import { authReducer } from '@/features/auth/authSlice';
import { authApi } from '@/features/auth/authApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeSlice.reducer,
    locale: localeSlice.reducer,
    [authApi.reducerPath]: authApi.reducer,
  },
  middleware: (getDefault) => getDefault().concat(authApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 把 store 挂到 window，便于 baseQuery 取 token / 触发 logout
(window as unknown as { __store: typeof store }).__store = store;
