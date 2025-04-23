import { useQueryClient } from "@tanstack/react-query";
import { UserRole } from "@/enums/user.enum";
import { logger } from "@/lib/logger";
import { useAuthStore } from "@/stores/auth/store";
import { useUserProfile } from "./profile";

// Create module-specific logger
const authLogger = logger.forModule("Auth:Hook");

/**
 * Main authentication hook that combines Zustand state with React Query profile data
 * This provides a unified interface for authentication state
 */
export const useAuth = () => {
  logger.time("Auth:UseAuthHook");
  authLogger.debug("useAuth hook called");
  
  // Get auth state from Zustand
  const authState = useAuthStore();
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
  
  // Build derived state with helper properties
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
  
  // Return combined state with original methods
  return { ...authState, ...derivedState };
}; 