import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '@/features/auth/adminAuthSlice';

export const RequireAdminAuth = ({ children }: { children: React.ReactNode }) => {
  const isAuthed = useSelector(selectIsAuthenticated);
  const location = useLocation();
  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
};
