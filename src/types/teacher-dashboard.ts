import { AssignmentStatus, ASSIGNMENT_STATUS } from "@/constants/assignment-status";

// Date range interface for filtering
export interface DateRange {
  from?: Date;
  to?: Date;
}

// Time period shortcuts for quick filtering
export type TimePeriod = 'last7days' | 'last30days' | 'last3months' | 'thisYear' | 'custom';

// Type for teacher dashboard filters
export interface TeacherDashboardFilters {
  // Status filters mapped from AssignmentStatus
  status: Record<AssignmentStatus, boolean>;
  // Subject filters - dynamically added
  subjects: Record<string, boolean>;
  // Grade filters - dynamically added
  grades: Record<string, boolean>;
  // Time-based filters
  dateRange?: DateRange;
  timePeriod?: TimePeriod;
  // Month-based filters (January, February, etc.)
  months?: Record<string, boolean>;
}

// Teaching subject type from user profile
export interface TeachingSubject {
  subject: string;
  grade: string;
} 