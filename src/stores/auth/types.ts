import { User } from "@supabase/supabase-js";
import { AuthState, AuthenticatedRole } from "@/types/auth";

/**
 * Enhanced User type with profile data
 */
export interface EnhancedUser extends User {
  role?: AuthenticatedRole;
  [key: string]: unknown; // Allow additional profile fields
}

/**
 * Updated AuthState interface for the Zustand store
 */
export interface EnhancedAuthState extends Omit<AuthState, 'user' | 'profile'> {
  user: EnhancedUser | null;
  initialize: () => Promise<() => void>;
  cleanup: () => void;
} 