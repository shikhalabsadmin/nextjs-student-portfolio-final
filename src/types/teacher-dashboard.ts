import { AssignmentStatus, ASSIGNMENT_STATUS } from "@/constants/assignment-status";

// Type for teacher dashboard filters
export interface TeacherDashboardFilters {
  // Status filters mapped from AssignmentStatus
  status: Record<AssignmentStatus, boolean>;
  // Subject filters - dynamically added
  subjects: Record<string, boolean>;
  // Grade filters - dynamically added
  grades: Record<string, boolean>;
}

// Teaching subject type from user profile
export interface TeachingSubject {
  subject: string;
  grade: string;
} 