import { Navigate } from "react-router-dom";
import { UserRole } from "@/enums/user.enum";
import { ROUTES } from "@/config/routes";
import { EnhancedUser } from "@/hooks/useAuthState";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
  user?: EnhancedUser | null;
  userRole?: UserRole | null;
  redirectTo?: string;
}

/**
 * ProtectedRoute - Simple component that restricts access based on authentication and role
 */
export const ProtectedRoute = ({ 
  children, 
  roles,
  user,
  userRole,
  redirectTo = ROUTES.COMMON.HOME
}: ProtectedRouteProps) => {
  
  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Role check - redirect to appropriate dashboard if needed
  if (roles?.length && userRole && !roles.includes(userRole)) {
    // Determine appropriate dashboard based on user's role
    const dashboardRoute = 
      userRole === UserRole.STUDENT ? ROUTES.STUDENT.DASHBOARD :
      userRole === UserRole.TEACHER ? ROUTES.TEACHER.DASHBOARD :
      userRole === UserRole.ADMIN ? ROUTES.ADMIN.DASHBOARD :
      ROUTES.COMMON.HOME;
    
    return <Navigate to={dashboardRoute} replace />;
  }

  // All checks passed - render children
  return <>{children}</>;
}; 