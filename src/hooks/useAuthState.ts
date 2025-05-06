import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useCallback } from "react";
import { UserRole } from "@/enums/user.enum";
import { logger } from "@/lib/logger";
import { PROFILE_KEYS } from "@/query-key/profile";
import { ROUTES } from "@/config/routes";
import { queryClient } from "@/query-key/client";
import { redirect } from "react-router-dom";
// Create module-specific logger
const authLogger = logger.forModule("Auth:Hook");

// Define profile data interface
interface ProfileData {
  id?: string;
  full_name?: string;
  [key: string]: unknown; // Allow additional profile fields
}

// Define the enhanced user type with role
export interface EnhancedUser extends User {
  role?: UserRole;
  [key: string]: unknown; // Allow for profile data
}

// Define our hook interface to match what components expect
interface AuthState {
  user: EnhancedUser | null;
  userRole: UserRole | null;
  profile: ProfileData | null;
  isLoading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
}

// A simpler hook that uses React Query internally but provides the same interface
export const useAuthState = (): AuthState => {
  authLogger.debug("useAuthState hook called");
  
  // Get session info
  const { 
    data: sessionData, 
    isLoading: isSessionLoading,
    error: sessionError
  } = useQuery({
    queryKey: PROFILE_KEYS.authSession,
    queryFn: async () => {
      authLogger.debug("Fetching auth session");
      const result = await supabase.auth.getSession();
      authLogger.debug("Auth session fetched", { 
        hasSession: !!result.data.session,
        userId: result.data.session?.user?.id
      });
      return result;
    },
  });

  // Get user profile if user exists
  const userId = sessionData?.data?.session?.user?.id;
  const { 
    data: profile, 
    isLoading: isProfileLoading,
    error: profileError
  } = useQuery({
    queryKey: PROFILE_KEYS.profile(userId),
    queryFn: async () => {
      if (!userId) return null;
      authLogger.debug("Fetching user profile", { userId });
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (error) {
        authLogger.error("Profile fetch error", { userId, error });
        throw error;
      }
      
      authLogger.debug("Profile fetched successfully", { userId, hasData: !!data });
      return data;
    },
    enabled: !!userId,
  });

  // Combine errors
  const error = sessionError || profileError;
  if (error) {
    authLogger.error("Auth error encountered", { 
      sessionError: sessionError?.message, 
      profileError: profileError?.message 
    });
  }

  // Basic user from session
  const user = sessionData?.data?.session?.user || null;
  
  // Get role from metadata
  const metadataRole = user?.user_metadata?.role?.toUpperCase() as UserRole;
  const userRole = metadataRole || null;
  
  // Enhanced user with profile data
  const enhancedUser = user ? {
    ...user,
    ...profile,
    role: userRole
  } : null;
  
  // Unified loading state
  const isLoading = isSessionLoading || isProfileLoading;

  // Sign out function
  const signOut = useCallback(async () => {
    authLogger.info("Signing out user", { userId: user?.id });
    await supabase.auth.signOut();
    queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.authSession });
    queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.profile(user?.id) });
    authLogger.info("Sign out successful");
    redirect(ROUTES.COMMON.HOME);
  }, [user?.id]);

  authLogger.debug("Auth state", { 
    userId: user?.id, 
    role: userRole, 
    hasProfile: !!profile,
    isLoading 
  });

  return {
    user: enhancedUser,
    userRole,
    profile,
    isLoading,
    error,
    signOut
  };
}; 