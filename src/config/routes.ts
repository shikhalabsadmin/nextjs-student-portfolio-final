import { UserRole } from "@/enums";
import { AuthenticatedRole } from "@/types/auth";
import { NavLink } from "@/types/navigation";

export const ROUTES = {
  // Common routes (accessible without authentication)
  COMMON: {
    HOME: "/",
    UPDATE_PASSWORD: "/auth/update-password",
  },

  // Student routes (UserRole.STUDENT)
  STUDENT: {
    DASHBOARD: "/student",
    ASSIGNMENTS: "/student/assignments",
    PROFILE: "/student/profile",
    SUBMIT: "/student/submit",
    SUBMIT_WITH_ID: "/student/submit/:id",
    DRAFT_EDIT: "/student/drafts/:id/edit",
  },

  // Teacher routes (UserRole.TEACHER)
  TEACHER: {
    DASHBOARD: "/teacher",
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

  // Shared Assignment routes (accessible by authenticated users)
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
export const getNavLinks = (userRole: AuthenticatedRole): NavLink[] => {
  switch (userRole) {
    case UserRole.STUDENT:
      return [{ to: ROUTES.STUDENT.PROFILE, label: "Profile" }];

    case UserRole.TEACHER:
      return [{ to: ROUTES.TEACHER.PROFILE, label: "Profile" }];

    case UserRole.ADMIN:
      return [
        { to: ROUTES.ADMIN.DASHBOARD, label: "Dashboard" },
        { to: ROUTES.ADMIN.USERS, label: "Users" },
        { to: ROUTES.ADMIN.REPORTS, label: "Reports" },
        { to: ROUTES.ADMIN.SETTINGS, label: "Settings" },
      ];

    default:
      return [];
  }
};
