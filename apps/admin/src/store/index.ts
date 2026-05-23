import { configureStore } from '@reduxjs/toolkit';
import { themeSlice, localeSlice } from '@maill/shared';
import { adminAuthReducer } from '@/features/auth/adminAuthSlice';
import { adminAuthApi } from '@/features/auth/adminAuthApi';
import { showsApi } from '@/features/shows/showsApi';
import { roomsApi } from '@/features/rooms/roomsApi';
import { sessionsApi } from '@/features/sessions/sessionsApi';
import { monitorApi } from '@/features/monitor/monitorApi';
import { adminOrdersApi } from '@/features/orders/ordersApi';
import { uploadApi } from '@/features/upload/uploadApi';
import { categoriesApi } from '@/features/categories/categoriesApi';

export const store = configureStore({
  reducer: {
    adminAuth: adminAuthReducer,
    theme: themeSlice.reducer,
    locale: localeSlice.reducer,
    [adminAuthApi.reducerPath]: adminAuthApi.reducer,
    [showsApi.reducerPath]: showsApi.reducer,
    [roomsApi.reducerPath]: roomsApi.reducer,
    [sessionsApi.reducerPath]: sessionsApi.reducer,
    [monitorApi.reducerPath]: monitorApi.reducer,
    [adminOrdersApi.reducerPath]: adminOrdersApi.reducer,
    [uploadApi.reducerPath]: uploadApi.reducer,
    [categoriesApi.reducerPath]: categoriesApi.reducer,
  },
  middleware: (getDefault) =>
    getDefault().concat(
      adminAuthApi.middleware,
      showsApi.middleware,
      roomsApi.middleware,
      sessionsApi.middleware,
      monitorApi.middleware,
      adminOrdersApi.middleware,
      uploadApi.middleware,
      categoriesApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

(window as unknown as { __store: typeof store }).__store = store;
