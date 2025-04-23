import { supabase } from "@/integrations/supabase/client";
import { ROUTES } from "@/config/routes";
import { logger } from "@/lib/logger";
import { QueryClient } from "@tanstack/react-query";
import { useAuthStore, updateAuthState } from "./store";

// Create module-specific logger
const authLogger = logger.forModule("Auth:Actions");

/**
 * Sign out the current user
 * This is implemented separately from the store to keep the store clean
 */
export const signOut = async (): Promise<void> => {
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
    updateAuthState(null, null);

    // If we're in a browser environment, access the queryClient
    if (typeof window !== 'undefined') {
      // Get the queryClient from the global window object
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
    updateAuthState(null, null);
    authLogger.debug("Forcing redirect to home", { path: ROUTES.COMMON.HOME });
    window.location.href = ROUTES.COMMON.HOME;
  }
};

// Patch the store's signOut method to point to our implementation
// This allows us to keep the store API the same while moving implementation details out
useAuthStore.setState({
  signOut
}); 