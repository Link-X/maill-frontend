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
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
