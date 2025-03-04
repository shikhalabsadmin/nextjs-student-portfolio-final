export enum UserRole {
  STUDENT = "STUDENT",
  TEACHER = "TEACHER",
  ADMIN = "ADMIN",
  PUBLIC = "PUBLIC",
}

export type AuthenticatedRole = Extract<
  UserRole,
  UserRole.STUDENT | UserRole.TEACHER | UserRole.ADMIN
>;
export type AnyRole = UserRole;

// Type guard to check if a role is authenticated
export const isAuthenticatedRole = (
  role: UserRole
): role is AuthenticatedRole => {
  return role !== UserRole.PUBLIC;
};

// Type guard to check if a string is a valid UserRole
export const isValidUserRole = (role: string): role is UserRole => {
  return Object.values(UserRole).includes(role as UserRole);
};
