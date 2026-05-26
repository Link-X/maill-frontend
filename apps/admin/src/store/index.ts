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
import { citiesApi } from '@/features/cities/citiesApi';
import { reportsApi } from '@/features/reports/reportsApi';
import { bannersApi } from '@/features/banners/bannersApi';
import { artistsApi } from '@/features/artists/artistsApi';
import { articleCategoriesApi } from '@/features/articles/articleCategoriesApi';
import { articlesApi } from '@/features/articles/articlesApi';
import { messagesApi } from '@/features/messages/messagesApi';
import { reviewsApi as adminReviewsApi } from '@/features/reviews/reviewsApi';

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
    [citiesApi.reducerPath]: citiesApi.reducer,
    [reportsApi.reducerPath]: reportsApi.reducer,
    [bannersApi.reducerPath]: bannersApi.reducer,
    [artistsApi.reducerPath]: artistsApi.reducer,
    [articleCategoriesApi.reducerPath]: articleCategoriesApi.reducer,
    [articlesApi.reducerPath]: articlesApi.reducer,
    [messagesApi.reducerPath]: messagesApi.reducer,
    [adminReviewsApi.reducerPath]: adminReviewsApi.reducer,
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
      citiesApi.middleware,
      reportsApi.middleware,
      bannersApi.middleware,
      artistsApi.middleware,
      articleCategoriesApi.middleware,
      articlesApi.middleware,
      messagesApi.middleware,
      adminReviewsApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

(window as unknown as { __store: typeof store }).__store = store;
