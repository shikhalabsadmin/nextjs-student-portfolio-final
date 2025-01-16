import { Navigate } from "react-router-dom";
import { useAuthState } from "@/hooks/useAuthState";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const { user, userRole } = useAuthState();

  useEffect(() => {
    console.log('ProtectedRoute mounted with:', { user, userRole, roles });
    return () => {
      console.log('ProtectedRoute unmounted');
    };
  }, []);

  useEffect(() => {
    console.log('ProtectedRoute auth state changed:', { user, userRole });
  }, [user, userRole]);

  console.log('ProtectedRoute rendering with:', { user, userRole, roles });

  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to /');
    return <Navigate to="/" replace />;
  }

  if (roles && !roles.includes(userRole)) {
    console.log('ProtectedRoute: Invalid role, redirecting to /app/assignments');
    return <Navigate to="/app/assignments" replace />;
  }

  return <>{children}</>;
}; 