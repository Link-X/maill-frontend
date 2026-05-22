import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { RequireAdminAuth } from './guards';
import AdminLayout from '@/layouts/AdminLayout';

const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const ShowsPage = lazy(() => import('@/features/shows/ShowsPage'));
const RoomsPage = lazy(() => import('@/features/rooms/RoomsPage'));
const RoomDetailPage = lazy(() => import('@/features/rooms/RoomDetailPage'));
const OrdersPage = lazy(() => import('@/features/orders/OrdersPage'));
const SessionsPage = lazy(() => import('@/features/sessions/SessionsPage'));
const SessionFormPage = lazy(() => import('@/features/sessions/SessionFormPage'));
const SessionDetailPage = lazy(() => import('@/features/sessions/SessionDetailPage'));

const withSuspense = (node: React.ReactNode) => (
  <Suspense fallback={<div className="p-6">Loading...</div>}>{node}</Suspense>
);

export const router = createBrowserRouter([
  { path: '/login', element: withSuspense(<LoginPage />) },
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
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
