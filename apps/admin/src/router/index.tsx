import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { RequireAdminAuth } from './guards';
import AdminLayout from '@/layouts/AdminLayout';

const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/RegisterPage'));
const ShowsPage = lazy(() => import('@/features/shows/ShowsPage'));
const RoomsPage = lazy(() => import('@/features/rooms/RoomsPage'));
const RoomDetailPage = lazy(() => import('@/features/rooms/RoomDetailPage'));
const OrdersPage = lazy(() => import('@/features/orders/OrdersPage'));
const CategoriesPage = lazy(() => import('@/features/categories/CategoriesPage'));
const BannersPage = lazy(() => import('@/features/banners/BannersPage'));
const ArtistsPage = lazy(() => import('@/features/artists/ArtistsPage'));
const ArticleCategoriesPage = lazy(() => import('@/features/articles/ArticleCategoriesPage'));
const ArticlesPage = lazy(() => import('@/features/articles/ArticlesPage'));
const ArticleEditPage = lazy(() => import('@/features/articles/ArticleEditPage'));
const ReportsPage = lazy(() => import('@/features/reports/ReportsPage'));
const MessagesPage = lazy(() => import('@/features/messages/MessagesPage'));
const SessionsPage = lazy(() => import('@/features/sessions/SessionsPage'));
const SessionFormPage = lazy(() => import('@/features/sessions/SessionFormPage'));
const SessionDetailPage = lazy(() => import('@/features/sessions/SessionDetailPage'));
const ReviewsPage = lazy(() => import('@/features/reviews/ReviewsPage'));
const ReviewReportsPage = lazy(() => import('@/features/reviews/ReportsPage'));

const withSuspense = (node: React.ReactNode) => (
  <Suspense fallback={<div className="p-6">Loading...</div>}>{node}</Suspense>
);

export const router = createBrowserRouter([
  { path: '/login', element: withSuspense(<LoginPage />) },
  { path: '/register', element: withSuspense(<RegisterPage />) },
  {
    path: '/',
    element: (
      <RequireAdminAuth>
        <AdminLayout />
      </RequireAdminAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/shows" replace /> },
      { path: 'shows', element: withSuspense(<ShowsPage />) },
      { path: 'shows/:id/sessions', element: withSuspense(<SessionsPage />) },
      { path: 'sessions/new', element: withSuspense(<SessionFormPage />) },
      { path: 'sessions/:id/edit', element: withSuspense(<SessionFormPage />) },
      { path: 'sessions/:id', element: withSuspense(<SessionDetailPage />) },
      { path: 'rooms', element: withSuspense(<RoomsPage />) },
      { path: 'rooms/:id', element: withSuspense(<RoomDetailPage />) },
      { path: 'orders', element: withSuspense(<OrdersPage />) },
      { path: 'categories', element: withSuspense(<CategoriesPage />) },
      { path: 'banners', element: withSuspense(<BannersPage />) },
      { path: 'artists', element: withSuspense(<ArtistsPage />) },
      { path: 'article-categories', element: withSuspense(<ArticleCategoriesPage />) },
      { path: 'articles', element: withSuspense(<ArticlesPage />) },
      { path: 'articles/edit', element: withSuspense(<ArticleEditPage />) },
      { path: 'articles/edit/:id', element: withSuspense(<ArticleEditPage />) },
      { path: 'reports', element: withSuspense(<ReportsPage />) },
      { path: 'messages', element: withSuspense(<MessagesPage />) },
      { path: 'reviews', element: withSuspense(<ReviewsPage />) },
      { path: 'reviews/reports', element: withSuspense(<ReviewReportsPage />) },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
