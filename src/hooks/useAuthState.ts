import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { TeachingSubject } from "@/types/supabase";
import { UserRole } from "@/enums/user.enum";
import { AuthState, Profile, AuthenticatedRole } from "@/types/auth";
import { ROUTES } from "@/config/routes";

export const useAuthState = create<AuthState>()((set) => ({
  user: null,
  userRole: UserRole.PUBLIC,
  isLoading: true,
  profile: null,
  signOut: async () => {
    try {
      console.log("[Auth] Starting sign out process");

      // Clear all local storage first
      console.log("[Auth] Clearing local storage");
      localStorage.clear();

      // Sign out from Supabase
      console.log("[Auth] Calling Supabase sign out");
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("[Auth] Error during sign out:", error);
        throw error;
      }

      // Clear the state
      console.log("[Auth] Clearing auth state");
      set({ user: null, userRole: UserRole.PUBLIC, profile: null });

      // Use navigate to go to login page
      console.log("[Auth] Redirecting to login page");
      window.location.href = ROUTES.AUTH.LOGIN;
    } catch (error) {
      console.error("[Auth] Unexpected error during sign out:", error);
      // Still clear the state even if there's an error
      set({ user: null, userRole: UserRole.PUBLIC, profile: null });
      // Force reload anyway to ensure clean state
      window.location.href = ROUTES.AUTH.LOGIN;
    }
  },
}));

let isInitialized = false;

// Initialize auth state
const initAuth = async () => {
  if (isInitialized) return;
  isInitialized = true;

  try {
    console.log("[Auth] Starting auth initialization");
    // Get initial session
    const {
      data: { session },
    } = await supabase.auth.getSession();
    console.log("[Auth] Initial session check:", {
      hasSession: !!session,
      userId: session?.user?.id,
      userRole: session?.user?.user_metadata?.role,
    });

    if (session?.user) {
      const role =
        session.user.user_metadata?.role?.toUpperCase() as AuthenticatedRole;
      console.log("[Auth] Fetching user profile:", {
        userId: session.user.id,
        role,
      });

      const { data, error } = await supabase
        .from("profiles")
        .select("*") // Select all fields
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("[Auth] Error fetching profile:", {
          error,
          userId: session.user.id,
        });
        useAuthState.setState({
          userRole: role,
          user: session.user,
          profile: null,
          isLoading: false,
        });
        return;
      }

      console.log("[Auth] Profile fetched successfully:", {
        userId: data.id,
        role: data.role,
        hasProfile: !!data,
      });

      useAuthState.setState({
        userRole: role,
        user: session.user,
        profile: {
          ...data,
          role: data.role.toUpperCase() as AuthenticatedRole,
        } as Profile,
        isLoading: false,
      });
    } else {
      console.log("[Auth] No active session found");
      useAuthState.setState({
        user: null,
        userRole: UserRole.PUBLIC,
        profile: null,
        isLoading: false,
      });
    }

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[Auth] Auth state change:", {
        event,
        userId: session?.user?.id,
        userRole: session?.user?.user_metadata?.role,
      });

      if (event === "SIGNED_IN" && session?.user) {
        const role =
          session.user.user_metadata?.role?.toUpperCase() as AuthenticatedRole;
        console.log("[Auth] User signed in, fetching profile:", {
          userId: session.user.id,
          role,
        });

        const { data, error } = await supabase
          .from("profiles")
          .select("*") // Select all fields
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.error("[Auth] Error fetching profile after sign in:", {
            error,
            userId: session.user.id,
          });
          useAuthState.setState({
            userRole: role,
            user: session.user,
            profile: null,
            isLoading: false,
          });
          return;
        }

        console.log("[Auth] Profile fetched after sign in:", {
          userId: data.id,
          role: data.role,
          hasProfile: !!data,
        });

        useAuthState.setState({
          userRole: role,
          user: session.user,
          profile: {
            ...data,
            role: data.role.toUpperCase() as AuthenticatedRole,
          } as Profile,
          isLoading: false,
        });
      } else if (event === "SIGNED_OUT") {
        console.log("[Auth] User signed out");
        useAuthState.setState({
          user: null,
          userRole: UserRole.PUBLIC,
          profile: null,
          isLoading: false,
        });
      }
    });

    return () => {
      console.log("[Auth] Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  } catch (error) {
    console.error("[Auth] Auth initialization error:", error);
    useAuthState.setState({
      user: null,
      userRole: UserRole.PUBLIC,
      profile: null,
      isLoading: false,
    });
  }
};

export { initAuth };
