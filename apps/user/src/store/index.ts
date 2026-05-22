import { configureStore } from '@reduxjs/toolkit';
import { themeSlice, localeSlice } from '@maill/shared';
import { authReducer } from '@/features/auth/authSlice';
import { authApi } from '@/features/auth/authApi';
import { showsApi } from '@/features/shows/showsApi';
import { sessionsApi } from '@/features/sessions/sessionsApi';
import { orderApi } from '@/features/order/orderApi';
import { paymentApi } from '@/features/payment/paymentApi';
import { cartSlice } from '@/features/sessions/cartSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeSlice.reducer,
    locale: localeSlice.reducer,
    cart: cartSlice.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [showsApi.reducerPath]: showsApi.reducer,
    [sessionsApi.reducerPath]: sessionsApi.reducer,
    [orderApi.reducerPath]: orderApi.reducer,
    [paymentApi.reducerPath]: paymentApi.reducer,
  },
  middleware: (getDefault) =>
    getDefault().concat(
      authApi.middleware,
      showsApi.middleware,
      sessionsApi.middleware,
      orderApi.middleware,
      paymentApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

(window as unknown as { __store: typeof store }).__store = store;
