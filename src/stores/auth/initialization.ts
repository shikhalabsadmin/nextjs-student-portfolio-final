import { Subscription } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthenticatedRole, isValidUserRole } from "@/types/auth";
import { logger } from "@/lib/logger";
import { QueryClient } from "@tanstack/react-query";
import { useAuthStore, updateAuthState, setStoreSubscription } from "./store";
import { EnhancedUser } from "./types";

// Create module-specific logger
const authLogger = logger.forModule("Auth:Init");

/**
 * Initialize the authentication state
 * This is implemented separately from the store to keep the store clean
 */
export const initialize = async (): Promise<() => void> => {
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
      updateAuthState(null, null);
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
      updateAuthState(null, null);
      logger.timeEnd("Auth:Initialize");
      return () => {};
    }

    // Initial update with session user data
    updateAuthState({ ...session.user, role: metadataRole }, metadataRole);

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
            updateAuthState(null, null);
            logger.timeEnd(`Auth:StateChange:${event}`);
            return;
          }

          // Update with basic user info immediately
          updateAuthState({ ...newSession.user, role: newRole }, newRole);
          
          // Invalidate profile query so React Query will refetch
          if (queryClientInstance) {
            authLogger.debug("Invalidating profile query on sign in", { userId: newSession.user.id });
            queryClientInstance.invalidateQueries({ queryKey: ['profile', newSession.user.id] });
          }
        } else if (event === "SIGNED_OUT") {
          authLogger.info("Processing SIGNED_OUT event");
          updateAuthState(null, null);
          
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

    const subscription = subscriptionData.subscription;
    setStoreSubscription(subscription);
    
    authLogger.debug("Subscription established", {
      hasSubscription: !!subscription,
    });

    logger.timeEnd("Auth:Initialize");
    return () => {
      authLogger.debug("Cleaning up subscription");
      subscription?.unsubscribe();
      setStoreSubscription(null);
      authLogger.debug("Subscription cleanup complete");
    };
  } catch (error) {
    authLogger.error("Initialization failed", error);
    updateAuthState(null, null);
    logger.timeEnd("Auth:Initialize");
    return () => {};
  }
};

// Singleton auth initializer
let isInitialized = false;

/**
 * Initialize the authentication system
 * This should be called once when the app starts
 */
export const initAuth = async (): Promise<(() => void) | undefined> => {
  authLogger.debug("Checking initialization status", { isInitialized });
  if (isInitialized) {
    authLogger.debug("Auth already initialized, skipping");
    return;
  }

  logger.time("Auth:InitAuth");
  authLogger.info("Starting auth initialization");
  isInitialized = true;
  
  // Patch the store's initialize method to point to our implementation
  useAuthStore.setState({
    initialize
  });
  
  const { cleanup } = useAuthStore.getState();

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