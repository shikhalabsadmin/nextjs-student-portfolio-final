import { AssignmentStatus } from "@/constants/assignment-status";
import { Subject, GradeLevel } from "@/constants/grade-subjects";
import { StatusFilterKeys, SubjectFilterKeys } from "@/utils/type-utils";

export interface StudentAssignment {
  id: number;
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

// Combine both types for the student dashboard filters
export type StudentDashboardFilters = StatusFilterKeys & SubjectFilterKeys; 