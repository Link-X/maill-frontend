import { configureStore } from '@reduxjs/toolkit';
import { themeSlice, localeSlice } from '@maill/shared';
import { authReducer } from '@/features/auth/authSlice';
import { authApi } from '@/features/auth/authApi';
import { showsApi } from '@/features/shows/showsApi';
import { sessionsApi } from '@/features/sessions/sessionsApi';
import { orderApi } from '@/features/order/orderApi';
import { paymentApi } from '@/features/payment/paymentApi';
import { verifyApi } from '@/features/verify/verifyApi';
import { cartSlice } from '@/features/sessions/cartSlice';
import { categoriesApi } from '@/features/categories/categoriesApi';
import { citiesApi } from '@/features/cities/citiesApi';
import { bannersApi } from '@/features/home/bannersApi';
import { artistsApi } from '@/features/artists/artistsApi';
import { articlesApi } from '@/features/articles/articlesApi';
import { messagesApi } from '@/features/messages/messagesApi';
import { favoritesApi } from '@/features/favorites/favoritesApi';
import { subscribeApi } from '@/features/subscriptions/subscribeApi';
import { searchApi } from '@/features/search/searchApi';
import { reviewsApi } from '@/features/reviews/reviewsApi';
import { uploadApi } from '@/api/uploadApi';

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
    [verifyApi.reducerPath]: verifyApi.reducer,
    [categoriesApi.reducerPath]: categoriesApi.reducer,
    [citiesApi.reducerPath]: citiesApi.reducer,
    [bannersApi.reducerPath]: bannersApi.reducer,
    [artistsApi.reducerPath]: artistsApi.reducer,
    [articlesApi.reducerPath]: articlesApi.reducer,
    [messagesApi.reducerPath]: messagesApi.reducer,
    [favoritesApi.reducerPath]: favoritesApi.reducer,
    [subscribeApi.reducerPath]: subscribeApi.reducer,
    [searchApi.reducerPath]: searchApi.reducer,
    [reviewsApi.reducerPath]: reviewsApi.reducer,
    [uploadApi.reducerPath]: uploadApi.reducer,
  },
  middleware: (getDefault) =>
    getDefault().concat(
      authApi.middleware,
      showsApi.middleware,
      sessionsApi.middleware,
      orderApi.middleware,
      paymentApi.middleware,
      verifyApi.middleware,
      categoriesApi.middleware,
      citiesApi.middleware,
      bannersApi.middleware,
      artistsApi.middleware,
      articlesApi.middleware,
      messagesApi.middleware,
      favoritesApi.middleware,
      subscribeApi.middleware,
      searchApi.middleware,
      reviewsApi.middleware,
      uploadApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

(window as unknown as { __store: typeof store }).__store = store;
