import { Navigate, useLocation } from "react-router-dom";
import { useAuthState } from "@/hooks/useAuthState";
import { useEffect } from "react";
import { UserRole } from "@/enums/user.enum";
import { ROUTES } from "@/config/routes";
import { Loading } from "@/components/ui/loading";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
  redirectTo?: string;
}

export const ProtectedRoute = ({ 
  children, 
  roles,
  redirectTo = ROUTES.COMMON.HOME 
}: ProtectedRouteProps) => {
  const { user, userRole, isLoading } = useAuthState();
  const location = useLocation();

  useEffect(() => {
    // Always log in production for easier debugging of this critical component
    console.log('ProtectedRoute evaluation:', { 
      user: user?.id, 
      userRole, 
      roles,
      path: location.pathname,
      isLoading,
      authenticated: !!user
    });
  }, [user, userRole, roles, location, isLoading]);

  // Show loading state
  if (isLoading) {
    console.log('ProtectedRoute: Loading state', { path: location.pathname });
    return <Loading fullScreen />;
  }

  // Not authenticated
  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to:', redirectTo, { from: location.pathname });
    return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />;
  }

  // Check role access if roles are specified
  if (roles && roles.length > 0) {
    const hasRequiredRole = roles.includes(userRole as UserRole);
    if (!hasRequiredRole) {
      console.warn('ProtectedRoute: Invalid role access attempt', { 
        userRole, 
        requiredRoles: roles,
        path: location.pathname 
      });
      
      // Redirect to appropriate dashboard based on user role
      const dashboardRoute = 
        userRole === UserRole.STUDENT 
          ? ROUTES.STUDENT.DASHBOARD
          : userRole === UserRole.TEACHER 
            ? ROUTES.TEACHER.DASHBOARD
            : userRole === UserRole.ADMIN
              ? ROUTES.ADMIN.DASHBOARD
              : ROUTES.COMMON.HOME;
              
      console.log('ProtectedRoute: Redirecting to dashboard', { dashboardRoute, from: location.pathname });
      return <Navigate to={dashboardRoute} replace state={{ from: location.pathname }} />;
    }
  }

  console.log('ProtectedRoute: Access granted', { path: location.pathname, userRole });
  return <>{children}</>;
}; 