import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AuthenticatedRole, isValidUserRole } from "@/types/auth";
import { logger } from "@/lib/logger";

// Create module-specific logger
const authLogger = logger.forModule("Auth:Profile");

/**
 * Fetch user profile data from Supabase
 * This is a standalone function that can be used with React Query
 */
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

/**
 * React Query hook to fetch and cache user profile data
 */
export const useUserProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchUserProfile(userId || ''),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
}; 