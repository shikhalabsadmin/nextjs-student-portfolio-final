import { User } from "@supabase/supabase-js";
import { TeachingSubject } from "./supabase";
import { UserRole } from "@/enums/user.enum";

export type AuthenticatedRole = Extract<
  UserRole,
  UserRole.STUDENT | UserRole.TEACHER | UserRole.ADMIN
>;

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: AuthenticatedRole;
  teaching_subjects?: TeachingSubject[];
  grade?: string | null;
}

export interface AuthState {
  user: User | null;
  userRole: AuthenticatedRole;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

// Type guards
export const isAuthenticatedRole = (
  role: UserRole
): role is AuthenticatedRole => {
  return [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN].includes(role);
};

export const isValidUserRole = (role: string): role is UserRole => {
  return Object.values(UserRole).includes(role as UserRole);
};
