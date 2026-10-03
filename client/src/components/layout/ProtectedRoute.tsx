import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserRole } from '../../types/index.ts';

interface ProtectedRouteProps {
  requiredRole?: UserRole;
}

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-3">
        <span className="material-symbols-outlined text-primary text-4xl animate-spin">
          progress_activity
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          Initializing Clinical Suite...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
