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
    console.log('ProtectedRoute mounted:', { 
      user, 
      userRole, 
      roles,
      path: location.pathname 
    });
  }, [user, userRole, roles, location]);

  // Show loading state
  if (isLoading) {
    return <Loading fullScreen />;
  }

  // Not authenticated
  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to:', redirectTo);
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  // Check role access if roles are specified
  if (roles && roles.length > 0) {
    const hasRequiredRole = roles.includes(userRole as UserRole);
    if (!hasRequiredRole) {
      console.log('ProtectedRoute: Invalid role, redirecting to dashboard');
      // Redirect to appropriate dashboard based on user role
      const dashboardRoute = 
        userRole === UserRole.STUDENT 
          ? ROUTES.STUDENT.DASHBOARD
          : userRole === UserRole.TEACHER 
            ? ROUTES.TEACHER.DASHBOARD
            : userRole === UserRole.ADMIN
              ? ROUTES.ADMIN.DASHBOARD
              : ROUTES.COMMON.HOME;
              
      return <Navigate to={dashboardRoute} replace state={{ from: location }} />;
    }
  }

  return <>{children}</>;
}; 