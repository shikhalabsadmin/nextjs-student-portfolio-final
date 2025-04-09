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
    PROFILE: "/student/profile",
    MANAGE_ASSIGNMENT: "/student/assignment/:id?",
    FEEDBACK_ASSIGNMENT: "/student/assignment/:id/feedback",
    VERIFIED_ASSIGNMENT: "/student/assignment/:id/verified",
  },

  // Teacher routes (UserRole.TEACHER)
  TEACHER: {
    DASHBOARD: "/teacher",
    PROFILE: "/teacher/profile",
    MANAGE_ASSIGNMENT: "/teacher/assignment/:id",
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
    DETAIL: "/assignments/:id",
  },
  
  // Student Portfolio route (public)
  PORTFOLIO: {
    STUDENT: "/:student_id",
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
