import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { RequireAdminAuth } from './guards';
import AdminLayout from '@/layouts/AdminLayout';

const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const ShowsPage = lazy(() => import('@/features/shows/ShowsPage'));
const RoomsPage = lazy(() => import('@/features/rooms/RoomsPage'));
const OrdersPage = lazy(() => import('@/features/orders/OrdersPage'));

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
      { path: 'rooms', element: withSuspense(<RoomsPage />) },
      { path: 'orders', element: withSuspense(<OrdersPage />) },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
