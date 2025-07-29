import { AssignmentStatus } from "@/constants/assignment-status";
import { Subject, GradeLevel } from "@/constants/grade-subjects";
import { StatusFilterKeys, SubjectFilterKeys } from "@/utils/type-utils";

// Date range interface for filtering
export interface DateRange {
  from?: Date;
  to?: Date;
}

// Time period shortcuts for quick filtering
export type TimePeriod = 'last7days' | 'last30days' | 'last3months' | 'thisYear' | 'custom';

export interface StudentAssignment {
  id: string; // Changed from number to string to match Supabase's UUID format
  title: string;
  subject: Subject;
  grade: GradeLevel;
  dueDate: string;
  status: AssignmentStatus;
  imageUrl: string;
}

export interface StudentProfile {
  id: number;
  name: string;
  grade: GradeLevel;
  email: string;
  avatar?: string;
}

export interface StudentDashboardState {
  searchQuery: string;
  selectedFilters: StudentDashboardFilters;
  currentGrade: GradeLevel;
}

// Enhanced student dashboard filters with time-based filtering
export interface StudentDashboardFilters extends StatusFilterKeys, SubjectFilterKeys {
  // Time-based filters
  dateRange?: DateRange;
  timePeriod?: TimePeriod;
  // Month-based filters (January, February, etc.)
  months?: Record<string, boolean>;
} 