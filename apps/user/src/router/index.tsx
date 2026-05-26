import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { RequireAuth } from './guards';
import MobileLayout from '@/layouts/MobileLayout';

const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/RegisterPage'));
const HomePage = lazy(() => import('@/features/home/HomePage'));
const OrdersPage = lazy(() => import('@/features/orders/OrdersPage'));
const ProfilePage = lazy(() => import('@/features/profile/ProfilePage'));
const ShowDetailPage = lazy(() => import('@/features/shows/ShowDetailPage'));
const SessionSeatPage = lazy(() => import('@/features/sessions/SessionSeatPage'));
const OrderConfirmPage = lazy(() => import('@/features/order/OrderConfirmPage'));
const OrderPayPage = lazy(() => import('@/features/order/OrderPayPage'));
const VerifyPage = lazy(() => import('@/features/verify/VerifyPage'));
const ArtistsListPage = lazy(() => import('@/features/artists/ArtistsListPage'));
const ArtistDetailPage = lazy(() => import('@/features/artists/ArtistDetailPage'));
const FollowsPage = lazy(() => import('@/features/artists/FollowsPage'));
const ArticlesListPage = lazy(() => import('@/features/articles/ArticlesListPage'));
const ArticleDetailPage = lazy(() => import('@/features/articles/ArticleDetailPage'));
const MessagesPage = lazy(() => import('@/features/messages/MessagesPage'));
const FavoritesPage = lazy(() => import('@/features/favorites/FavoritesPage'));
const FavoriteGroupsPage = lazy(() => import('@/features/favorites/FavoriteGroupsPage'));
const SubscriptionsPage = lazy(() => import('@/features/subscriptions/SubscriptionsPage'));
const SearchPage = lazy(() => import('@/features/search/SearchPage'));
const PublishReviewPage = lazy(() => import('@/features/reviews/PublishReviewPage'));
const ReviewDetailPage = lazy(() => import('@/features/reviews/ReviewDetailPage'));

const withSuspense = (node: React.ReactNode) => (
  <Suspense fallback={<div className="p-4">Loading...</div>}>{node}</Suspense>
);

export const router = createBrowserRouter([
  { path: '/login', element: withSuspense(<LoginPage />) },
  { path: '/register', element: withSuspense(<RegisterPage />) },
  {
    path: '/',
    element: (
      <RequireAuth>
        <MobileLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: withSuspense(<HomePage />) },
      { path: 'orders', element: withSuspense(<OrdersPage />) },
      { path: 'profile', element: withSuspense(<ProfilePage />) },
      { path: 'show/:id', element: withSuspense(<ShowDetailPage />) },
      { path: 'session/:id', element: withSuspense(<SessionSeatPage />) },
      { path: 'order/confirm', element: withSuspense(<OrderConfirmPage />) },
      { path: 'order/:orderNo/pay', element: withSuspense(<OrderPayPage />) },
      { path: 'verify', element: withSuspense(<VerifyPage />) },
      { path: 'artists', element: withSuspense(<ArtistsListPage />) },
      { path: 'artist/:id', element: withSuspense(<ArtistDetailPage />) },
      { path: 'follows', element: withSuspense(<FollowsPage />) },
      { path: 'articles', element: withSuspense(<ArticlesListPage />) },
      { path: 'article/:id', element: withSuspense(<ArticleDetailPage />) },
      { path: 'messages', element: withSuspense(<MessagesPage />) },
      { path: 'favorites', element: withSuspense(<FavoritesPage />) },
      { path: 'favorites/groups', element: withSuspense(<FavoriteGroupsPage />) },
      { path: 'subscriptions', element: withSuspense(<SubscriptionsPage />) },
      { path: 'search', element: withSuspense(<SearchPage />) },
      { path: 'review/publish', element: withSuspense(<PublishReviewPage />) },
      { path: 'review/:id', element: withSuspense(<ReviewDetailPage />) },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
