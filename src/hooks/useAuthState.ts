// Re-export everything from our new modular structure
// This maintains backward compatibility for existing code

import { useAuthStore, initAuth } from "@/stores/auth";
import type { EnhancedUser } from "@/stores/auth";
import { useAuth, useUserProfile, fetchUserProfile } from "./auth";

// Re-export for backward compatibility
export type { EnhancedUser };
export const useAuthState = useAuthStore;
export { initAuth, useAuth, useUserProfile, fetchUserProfile }; 