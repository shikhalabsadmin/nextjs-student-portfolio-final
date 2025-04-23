import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserRole } from "@/enums/user.enum";
import { AuthenticatedRole, isValidUserRole } from "@/types/auth";
import { logger } from "@/lib/logger";
import { useAuthStore, initAuth as initializeAuth } from "@/stores/authStore";
import type { EnhancedUser } from "@/stores/authStore";

// Create module-specific logger
const authLogger = logger.forModule("Auth");

// Re-export for convenience
export type { EnhancedUser };
export { initializeAuth as initAuth };
export const useAuthState = useAuthStore;

// Fetch profile function for React Query
export const fetchUserProfile = async (userId: string): Promise<{ role: AuthenticatedRole; [key: string]: unknown } | null> => {
  if (!userId) return null;
  
  authLogger.debug("Fetching profile with React Query", { userId });
  try {
    logger.time(`Auth:ProfileQuery:${userId}`);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    logger.timeEnd(`Auth:ProfileQuery:${userId}`);

    if (error) {
      authLogger.error("Profile query failed", { userId, error });
      throw error;
    }

    if (!data) {
      authLogger.warn("No profile data found", { userId });
      return null;
    }

    const dbRole = data.role.toUpperCase();
    if (!isValidUserRole(dbRole)) {
      authLogger.error("Invalid role detected", { dbRole, userId });
      throw new Error(`Invalid role: ${dbRole}`);
    }

    return { ...data, role: dbRole as AuthenticatedRole };
  } catch (error) {
    authLogger.error("Profile fetch failed", { userId, error });
    throw error;
  }
};

// Hook to fetch user profile with React Query
export const useUserProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchUserProfile(userId || ''),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
};

// Authentication utility hook
export const useAuth = () => {
  logger.time("Auth:UseAuthHook");
  authLogger.debug("useAuth hook called");
  const authState = useAuthState();
  const userId = authState.user?.id;
  const queryClient = useQueryClient();
  
  // Use React Query to fetch profile data
  const { data: profile, isLoading: isProfileLoading } = useUserProfile(userId);
  
  // Merge profile data with user if available
  let enhancedUser = authState.user;
  if (profile && authState.user) {
    enhancedUser = {
      ...authState.user,
      ...profile,
    };
  }
  
  const userRole = enhancedUser?.role || authState.userRole;
  
  const derivedState = {
    user: enhancedUser,
    userRole,
    isLoading: authState.isLoading || isProfileLoading,
    isAuthenticated: !!enhancedUser && !!userRole,
    isAdmin: userRole === UserRole.ADMIN,
    isStudent: userRole === UserRole.STUDENT,
    isTeacher: userRole === UserRole.TEACHER,
    refreshProfile: () => {
      if (userId) {
        authLogger.debug("Manually refreshing profile", { userId });
        return queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      }
    }
  };
  
  authLogger.debug("Returning enhanced auth state", {
    ...derivedState,
    userId: enhancedUser?.id,
    hasProfile: !!profile,
  });
  logger.timeEnd("Auth:UseAuthHook");
  return { ...authState, ...derivedState };
};