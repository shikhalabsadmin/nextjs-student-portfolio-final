import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { User, Subscription } from "@supabase/supabase-js";
import { UserRole } from "@/enums/user.enum";
import {
  AuthState,
  AuthenticatedRole,
  isValidUserRole,
} from "@/types/auth";
import { ROUTES } from "@/config/routes";
import { logger } from "@/lib/logger";
import { useQuery, useQueryClient, QueryClient } from "@tanstack/react-query";

// Create module-specific logger
const authLogger = logger.forModule("Auth");

// Enhanced User type with profile data
export interface EnhancedUser extends User {
  role?: AuthenticatedRole;
  [key: string]: unknown; // Allow additional profile fields
}

// Updated AuthState interface
interface EnhancedAuthState extends Omit<AuthState, 'user' | 'profile'> {
  user: EnhancedUser | null;
  initialize: () => Promise<() => void>;
  cleanup: () => void;
}

// Authentication store
export const useAuthState = create<EnhancedAuthState>((set) => {
  let subscription: Subscription | null = null;

  // Update authentication state
  const updateState = (
    user: EnhancedUser | null,
    role: AuthenticatedRole | null
  ) => {
    authLogger.debug("Updating state", {
      userId: user?.id,
      role,
      hasAdditionalData: user ? Object.keys(user).length > Object.keys({} as User).length : false,
    });
    set({ user, userRole: role, isLoading: false });
    authLogger.debug("State update complete", { userId: user?.id, role });
  };

  return {
    user: null,
    userRole: null,
    isLoading: true,
    // Sign out user and clear state
    signOut: async () => {
      authLogger.info("Starting sign out process");
      try {
        logger.time("Auth:SignOut");
        authLogger.debug("Calling Supabase signOut");
        await supabase.auth.signOut();
        logger.timeEnd("Auth:SignOut");
        authLogger.debug("Supabase signOut successful");

        authLogger.debug("Clearing localStorage");
        localStorage.clear();

        authLogger.debug("Updating state to signed out");
        updateState(null, null);

        // If we're in a browser environment, access the queryClient
        if (typeof window !== 'undefined') {
          // Get the queryClient from the global window object
          // This is a lightweight way to access the queryClient without a hook
          const queryClientInstance = (window as { __REACT_QUERY_GLOBAL_CLIENT__?: QueryClient }).__REACT_QUERY_GLOBAL_CLIENT__;
          if (queryClientInstance) {
            authLogger.debug("Invalidating all queries on sign out");
            queryClientInstance.invalidateQueries();
          }
        }

        authLogger.info("Redirecting to home", { path: ROUTES.COMMON.HOME });
        window.location.href = ROUTES.COMMON.HOME;
      } catch (error) {
        authLogger.error("Sign out failed", error);
        authLogger.debug("Forcing state cleanup due to error");
        updateState(null, null);
        authLogger.debug("Forcing redirect to home", { path: ROUTES.COMMON.HOME });
        window.location.href = ROUTES.COMMON.HOME;
      }
    },
    // Initialize authentication state
    initialize: async () => {
      authLogger.info("Starting initialization");
      logger.time("Auth:Initialize");
      try {
        logger.time("Auth:GetSession");
        authLogger.debug("Fetching current session");
        const {
          data: { session },
        } = await supabase.auth.getSession();
        logger.timeEnd("Auth:GetSession");
        
        authLogger.debug("Session fetch complete", {
          hasSession: !!session,
          userId: session?.user?.id,
        });

        if (!session?.user) {
          authLogger.info("No active session found");
          updateState(null, null);
          logger.timeEnd("Auth:Initialize");
          return () => {};
        }

        const metadataRole = session.user.user_metadata?.role?.toUpperCase() as AuthenticatedRole;
        authLogger.debug("Checking metadata role", {
          metadataRole,
          userId: session.user.id,
        });

        if (!isValidUserRole(metadataRole)) {
          authLogger.error("Invalid metadata role", { metadataRole, userId: session.user.id });
          updateState(null, null);
          logger.timeEnd("Auth:Initialize");
          return () => {};
        }

        // Initial update with session user data
        updateState({ ...session.user, role: metadataRole }, metadataRole);

        logger.time("Auth:SetupAuthListener");
        authLogger.debug("Setting up auth state change listener");
        const { data: subscriptionData } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            logger.time(`Auth:StateChange:${event}`);
            authLogger.debug("Auth state change detected", {
              event,
              userId: newSession?.user?.id,
            });

            // If we're in a browser environment, access the queryClient
            const queryClientInstance = typeof window !== 'undefined' 
              ? (window as { __REACT_QUERY_GLOBAL_CLIENT__?: QueryClient }).__REACT_QUERY_GLOBAL_CLIENT__ 
              : null;

            if (event === "SIGNED_IN" && newSession?.user) {
              const newRole = newSession.user.user_metadata?.role?.toUpperCase() as AuthenticatedRole;
              authLogger.info("Processing SIGNED_IN event", {
                userId: newSession.user.id,
                newRole,
              });

              if (!isValidUserRole(newRole)) {
                authLogger.error("Invalid role in SIGNED_IN event", { newRole, userId: newSession.user.id });
                updateState(null, null);
                logger.timeEnd(`Auth:StateChange:${event}`);
                return;
              }

              // Update with basic user info immediately
              updateState({ ...newSession.user, role: newRole }, newRole);
              
              // Invalidate profile query so React Query will refetch
              if (queryClientInstance) {
                authLogger.debug("Invalidating profile query on sign in", { userId: newSession.user.id });
                queryClientInstance.invalidateQueries({ queryKey: ['profile', newSession.user.id] });
              }
            } else if (event === "SIGNED_OUT") {
              authLogger.info("Processing SIGNED_OUT event");
              updateState(null, null);
              
              // Clear all queries on sign out
              if (queryClientInstance) {
                authLogger.debug("Invalidating all queries on sign out");
                queryClientInstance.invalidateQueries();
              }
            } else if (event === "USER_UPDATED") {
              authLogger.info("User updated", { userId: newSession?.user?.id });
              
              // Invalidate profile query when user is updated
              if (queryClientInstance && newSession?.user?.id) {
                authLogger.debug("Invalidating profile query on user update", { userId: newSession.user.id });
                queryClientInstance.invalidateQueries({ queryKey: ['profile', newSession.user.id] });
              }
            } else if (event === "TOKEN_REFRESHED") {
              authLogger.debug("Token refreshed", { userId: newSession?.user?.id });
            } else if (event === "PASSWORD_RECOVERY") {
              authLogger.info("Password recovery initiated", { userId: newSession?.user?.id });
            }
            logger.timeEnd(`Auth:StateChange:${event}`);
          }
        );
        logger.timeEnd("Auth:SetupAuthListener");

        subscription = subscriptionData.subscription;
        authLogger.debug("Subscription established", {
          hasSubscription: !!subscription,
        });

        logger.timeEnd("Auth:Initialize");
        return () => {
          authLogger.debug("Cleaning up subscription");
          subscription?.unsubscribe();
          subscription = null;
          authLogger.debug("Subscription cleanup complete");
        };
      } catch (error) {
        authLogger.error("Initialization failed", error);
        updateState(null, null);
        logger.timeEnd("Auth:Initialize");
        return () => {};
      }
    },
    // Cleanup subscription and reset loading state
    cleanup: () => {
      authLogger.debug("Starting cleanup");
      if (subscription) {
        authLogger.debug("Unsubscribing from auth state changes");
        subscription.unsubscribe();
        subscription = null;
      }
      authLogger.debug("Resetting loading state");
      set({ isLoading: false });
      authLogger.debug("Cleanup complete");
    },
  };
});

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

// Singleton auth initializer
let isInitialized = false;
export const initAuth = async () => {
  authLogger.debug("Checking initialization status", { isInitialized });
  if (isInitialized) {
    authLogger.debug("Auth already initialized, skipping");
    return;
  }

  logger.time("Auth:InitAuth");
  authLogger.info("Starting auth initialization");
  isInitialized = true;
  const { initialize, cleanup } = useAuthState.getState();

  try {
    authLogger.debug("Calling initialize function");
    const unsubscribe = await initialize();
    authLogger.info("Initialization completed successfully");
    logger.timeEnd("Auth:InitAuth");

    const cleanupHandler = () => {
      authLogger.debug("Window unload detected, starting cleanup");
      logger.time("Auth:Cleanup");
      unsubscribe();
      cleanup();
      isInitialized = false;
      logger.timeEnd("Auth:Cleanup");
      authLogger.debug("Window unload cleanup complete");
    };

    authLogger.debug("Adding window unload event listener");
    window.addEventListener("unload", cleanupHandler);

    return () => {
      authLogger.debug("Manual cleanup requested");
      logger.time("Auth:ManualCleanup");
      window.removeEventListener("unload", cleanupHandler);
      cleanupHandler();
      logger.timeEnd("Auth:ManualCleanup");
      authLogger.debug("Manual cleanup complete");
    };
  } catch (error) {
    authLogger.error("Init auth failed", error);
    isInitialized = false;
    logger.timeEnd("Auth:InitAuth");
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