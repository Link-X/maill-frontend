import { configureStore } from '@reduxjs/toolkit';
import { themeSlice, localeSlice } from '@maill/shared';
import { adminAuthReducer } from '@/features/auth/adminAuthSlice';
import { adminAuthApi } from '@/features/auth/adminAuthApi';

export const store = configureStore({
  reducer: {
    adminAuth: adminAuthReducer,
    theme: themeSlice.reducer,
    locale: localeSlice.reducer,
    [adminAuthApi.reducerPath]: adminAuthApi.reducer,
  },
  middleware: (getDefault) => getDefault().concat(adminAuthApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

(window as unknown as { __store: typeof store }).__store = store;
