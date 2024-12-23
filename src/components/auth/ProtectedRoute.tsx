import { Navigate, useLocation } from 'react-router-dom';
import { useAuthState } from '@/hooks/useAuthState';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, userRole } = useAuthState();
  const location = useLocation();

  console.log('ProtectedRoute check:', { 
    isAuthenticated, 
    userRole,
    currentPath: location.pathname,
    roles 
  });

  // Wait for auth state to be determined
  if (isAuthenticated === null) {
    return null;
  }

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to /');
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(userRole)) {
    console.log('Unauthorized role, redirecting to dashboard');
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
} 