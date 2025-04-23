import { create } from "zustand";
import { User, Subscription } from "@supabase/supabase-js";
import { AuthenticatedRole, isValidUserRole } from "@/types/auth";
import { logger } from "@/lib/logger";
import { EnhancedAuthState, EnhancedUser } from "./types";

// Create module-specific logger
const authLogger = logger.forModule("Auth:Store");

// Type for internal store state that includes subscription
interface InternalStoreState extends EnhancedAuthState {
  _subscription?: Subscription | null;
}

// Authentication store
export const useAuthStore = create<EnhancedAuthState>((set) => {
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
      // Implementation moved to actions.ts
      // This is just a placeholder that will be populated by the actions
      return Promise.resolve();
    },
    // Initialize authentication state
    initialize: async () => {
      // Implementation moved to initialization.ts
      // This is just a placeholder that will be populated by the initialization logic
      return () => {};
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

// Helper function to update auth state (used by other modules)
export const updateAuthState = (
  user: EnhancedUser | null,
  role: AuthenticatedRole | null
) => {
  authLogger.debug("External update state request", { userId: user?.id, role });
  useAuthStore.setState({ 
    user, 
    userRole: role, 
    isLoading: false 
  });
};

// Store the subscription in a module-level variable to avoid any
let _subscription: Subscription | null = null;

// Helper to get store subscription
export const getStoreSubscription = (): Subscription | null => {
  return _subscription;
};

// Helper to set store subscription
export const setStoreSubscription = (sub: Subscription | null): void => {
  _subscription = sub;
}; 