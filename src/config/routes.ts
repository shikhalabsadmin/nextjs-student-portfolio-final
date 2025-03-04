import { UserRole } from "@/enums";
import { AuthenticatedRole } from "@/types/auth";
import { NavLink } from "@/types/navigation";

export const ROUTES = {
  // Public routes (UserRole.PUBLIC)
  PUBLIC: {
    HOME: "/",
    PORTFOLIO: "/portfolio",
  },

  // Student routes (UserRole.STUDENT)
  STUDENT: {
    ROOT: "/student",
    DASHBOARD: "/student/dashboard",
    ASSIGNMENTS: "/student/assignments",
    PROFILE: "/student/profile",
    SUBMIT: "/student/submit",
    SUBMIT_WITH_ID: "/student/submit/:id",
    DRAFT_EDIT: "/student/drafts/:id/edit",
  },

  // Teacher routes (UserRole.TEACHER)
  TEACHER: {
    ROOT: "/teacher",
    DASHBOARD: "/teacher/dashboard",
    ASSIGNMENTS: "/teacher/assignments",
    PROFILE: "/teacher/profile",
    NEW_ASSIGNMENT: "/teacher/assignments/new",
    VERIFY_ASSIGNMENT: "/teacher/verify/:id",
  },

  // Admin routes (UserRole.ADMIN)
  ADMIN: {
    ROOT: "/admin",
    DASHBOARD: "/admin/dashboard",
    USERS: "/admin/users",
    SETTINGS: "/admin/settings",
    REPORTS: "/admin/reports",
  },

  // Shared Assignment routes (accessible by multiple roles)
  ASSIGNMENT: {
    ROOT: "/assignments",
    LIST: "/assignments",
    DETAIL: "/assignments/:id",
    EDIT: "/assignments/:id/edit",
    VIEW: "/assignments/:id/view",
  },

  // Helper function to replace route params
  withParams: (route: string, params: Record<string, string>) => {
    let result = route;
    Object.entries(params).forEach(([key, value]) => {
      result = result.replace(`:${key}`, value);
    });
    return result;
  },
} as const;

// Navigation configurations
export const getNavLinks = (
  userRole: AuthenticatedRole | UserRole.PUBLIC
): NavLink[] => {
  switch (userRole) {
    case UserRole.STUDENT:
      return [
        { to: ROUTES.STUDENT.DASHBOARD, label: "Dashboard" },
        { to: ROUTES.STUDENT.ASSIGNMENTS, label: "My Assignments" },
        { to: ROUTES.STUDENT.PROFILE, label: "My Profile" },
      ];

    case UserRole.TEACHER:
      return [
        { to: ROUTES.TEACHER.ASSIGNMENTS, label: "Assignments" },
        { to: ROUTES.TEACHER.PROFILE, label: "Profile" },
      ];

    case UserRole.ADMIN:
      return [
        { to: ROUTES.ADMIN.DASHBOARD, label: "Dashboard" },
        { to: ROUTES.ADMIN.USERS, label: "Users" },
        { to: ROUTES.ADMIN.REPORTS, label: "Reports" },
        { to: ROUTES.ADMIN.SETTINGS, label: "Settings" },
      ];

    case UserRole.PUBLIC:
      return [
        { to: ROUTES.PUBLIC.HOME, label: "Home" },
        { to: ROUTES.PUBLIC.PORTFOLIO, label: "Portfolio" },
      ];

    default:
      return [];
  }
};
