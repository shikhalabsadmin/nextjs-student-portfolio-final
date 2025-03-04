import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { User, Subscription } from "@supabase/supabase-js";
import { UserRole } from "@/enums/user.enum";
import {
  AuthState,
  Profile,
  AuthenticatedRole,
  isValidUserRole,
} from "@/types/auth";
import { ROUTES } from "@/config/routes";

// Debug utility enabled in development
const DEBUG = {
  enabled: process.env.NODE_ENV === "development",
  log: (message: string, data?: unknown) =>
    DEBUG.enabled && console.log(`[Auth] ${message}`, data ?? ""),
  error: (message: string, error?: unknown) =>
    DEBUG.enabled && console.error(`[Auth Error] ${message}`, error ?? ""),
};

// Enhanced AuthState interface
interface EnhancedAuthState extends AuthState {
  initialize: () => Promise<() => void>;
  cleanup: () => void;
}

// Profile fetch result type
interface ProfileFetchResult {
  profile: Profile | null;
  error?: Error;
}

// Authentication store
export const useAuthState = create<EnhancedAuthState>((set) => {
  let subscription: Subscription | null = null;

  // Fetch user profile with retry mechanism
  const fetchProfile = async (
    userId: string,
    role: string,
    retries = 1
  ): Promise<ProfileFetchResult> => {
    DEBUG.log("Starting profile fetch", { userId, role, retries });
    try {
      DEBUG.log("Querying Supabase for profile", { userId });
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        DEBUG.error("Supabase query failed", error);
        throw error;
      }
      if (!data) {
        DEBUG.log("No profile data found", { userId });
        return { profile: null };
      }

      DEBUG.log("Profile data retrieved", { userId, role: data.role });
      const dbRole = data.role.toUpperCase();
      if (!isValidUserRole(dbRole)) {
        DEBUG.error("Invalid role detected", { dbRole, userId });
        throw new Error(`Invalid role: ${dbRole}`);
      }

      const profile = { ...data, role: dbRole as AuthenticatedRole };
      DEBUG.log("Profile fetch successful", { userId, role: profile.role });
      return { profile };
    } catch (error) {
      DEBUG.error("Profile fetch attempt failed", { userId, retries, error });
      if (retries > 0) {
        DEBUG.log("Retrying profile fetch", {
          userId,
          retriesLeft: retries - 1,
        });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return fetchProfile(userId, role, retries - 1);
      }
      DEBUG.log("Profile fetch exhausted retries", { userId });
      return { profile: null, error: error as Error };
    }
  };

  // Update authentication state
  const updateState = (
    user: User | null,
    role: AuthenticatedRole | UserRole.PUBLIC,
    profile: Profile | null
  ) => {
    DEBUG.log("Updating state", {
      userId: user?.id,
      role,
      hasProfile: !!profile,
    });
    set({ user, userRole: role, profile, isLoading: false });
    DEBUG.log("State update complete", { userId: user?.id, role });
  };

  return {
    user: null,
    userRole: UserRole.PUBLIC,
    isLoading: true,
    profile: null,
    // Sign out user and clear state
    signOut: async () => {
      DEBUG.log("Starting sign out process");
      try {
        DEBUG.log("Calling Supabase signOut");
        await supabase.auth.signOut();
        DEBUG.log("Supabase signOut successful");

        DEBUG.log("Clearing localStorage");
        localStorage.clear();

        DEBUG.log("Updating state to signed out");
        updateState(null, UserRole.PUBLIC, null);

        DEBUG.log("Redirecting to home", { path: ROUTES.PUBLIC.HOME });
        window.location.href = ROUTES.PUBLIC.HOME;
      } catch (error) {
        DEBUG.error("Sign out failed", error);
        DEBUG.log("Forcing state cleanup due to error");
        updateState(null, UserRole.PUBLIC, null);
        DEBUG.log("Forcing redirect to home", { path: ROUTES.PUBLIC.HOME });
        window.location.href = ROUTES.PUBLIC.HOME;
      }
    },
    // Initialize authentication state
    initialize: async () => {
      DEBUG.log("Starting initialization");
      try {
        DEBUG.log("Fetching current session");
        const {
          data: { session },
        } = await supabase.auth.getSession();
        DEBUG.log("Session fetch complete", {
          hasSession: !!session,
          userId: session?.user?.id,
        });

        if (!session?.user) {
          DEBUG.log("No active session found");
          updateState(null, UserRole.PUBLIC, null);
          return () => {};
        }

        const metadataRole = (
          session.user.user_metadata?.role || UserRole.PUBLIC
        ).toUpperCase() as AuthenticatedRole | UserRole.PUBLIC;
        DEBUG.log("Checking metadata role", {
          metadataRole,
          userId: session.user.id,
        });

        if (!isValidUserRole(metadataRole)) {
          DEBUG.error("Invalid metadata role", { metadataRole });
          updateState(null, UserRole.PUBLIC, null);
          return () => {};
        }

        const role = metadataRole as AuthenticatedRole;
        DEBUG.log("Fetching profile for user", {
          userId: session.user.id,
          role,
        });
        const { profile } = await fetchProfile(session.user.id, role);

        DEBUG.log("Updating state with session data", {
          userId: session.user.id,
          role,
        });
        updateState(session.user, role, profile);

        DEBUG.log("Setting up auth state change listener");
        const { data: subscriptionData } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            DEBUG.log("Auth state change detected", {
              event,
              userId: newSession?.user?.id,
            });

            if (event === "SIGNED_IN" && newSession?.user) {
              const newRole = (
                newSession.user.user_metadata?.role || UserRole.PUBLIC
              ).toUpperCase() as AuthenticatedRole | UserRole.PUBLIC;
              DEBUG.log("Processing SIGNED_IN event", {
                userId: newSession.user.id,
                newRole,
              });

              if (!isValidUserRole(newRole)) {
                DEBUG.error("Invalid role in SIGNED_IN event", { newRole });
                updateState(null, UserRole.PUBLIC, null);
                return;
              }

              DEBUG.log("Fetching profile for signed in user", {
                userId: newSession.user.id,
              });
              const { profile } = await fetchProfile(
                newSession.user.id,
                newRole
              );
              DEBUG.log("Updating state after sign in", {
                userId: newSession.user.id,
                newRole,
              });
              updateState(
                newSession.user,
                newRole as AuthenticatedRole,
                profile
              );
            } else if (event === "SIGNED_OUT") {
              DEBUG.log("Processing SIGNED_OUT event");
              updateState(null, UserRole.PUBLIC, null);
            }
          }
        );

        subscription = subscriptionData.subscription;
        DEBUG.log("Subscription established", {
          hasSubscription: !!subscription,
        });

        return () => {
          DEBUG.log("Cleaning up subscription");
          subscription?.unsubscribe();
          subscription = null;
          DEBUG.log("Subscription cleanup complete");
        };
      } catch (error) {
        DEBUG.error("Initialization failed", error);
        updateState(null, UserRole.PUBLIC, null);
        return () => {};
      }
    },
    // Cleanup subscription and reset loading state
    cleanup: () => {
      DEBUG.log("Starting cleanup");
      if (subscription) {
        DEBUG.log("Unsubscribing from auth state changes");
        subscription.unsubscribe();
        subscription = null;
      }
      DEBUG.log("Resetting loading state");
      set({ isLoading: false });
      DEBUG.log("Cleanup complete");
    },
  };
});

// Singleton auth initializer
let isInitialized = false;
export const initAuth = async () => {
  DEBUG.log("Checking initialization status", { isInitialized });
  if (isInitialized) {
    DEBUG.log("Auth already initialized, skipping");
    return;
  }

  DEBUG.log("Starting auth initialization");
  isInitialized = true;
  const { initialize, cleanup } = useAuthState.getState();

  try {
    DEBUG.log("Calling initialize function");
    const unsubscribe = await initialize();
    DEBUG.log("Initialization completed successfully");

    const cleanupHandler = () => {
      DEBUG.log("Window unload detected, starting cleanup");
      unsubscribe();
      cleanup();
      isInitialized = false;
      DEBUG.log("Window unload cleanup complete");
    };

    DEBUG.log("Adding window unload event listener");
    window.addEventListener("unload", cleanupHandler);

    return () => {
      DEBUG.log("Manual cleanup requested");
      window.removeEventListener("unload", cleanupHandler);
      cleanupHandler();
      DEBUG.log("Manual cleanup completed");
    };
  } catch (error) {
    DEBUG.error("Init auth failed", error);
    isInitialized = false;
    throw error;
  }
};

// Authentication utility hook
export const useAuth = () => {
  DEBUG.log("useAuth hook called");
  const authState = useAuthState();
  const derivedState = {
    isAuthenticated: !!authState.user && authState.userRole !== UserRole.PUBLIC,
    isAdmin: authState.userRole === UserRole.ADMIN,
  };
  DEBUG.log("Returning auth state", {
    ...derivedState,
    userId: authState.user?.id,
  });
  return { ...authState, ...derivedState };
};
