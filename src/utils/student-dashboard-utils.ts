import { ASSIGNMENT_STATUS } from "@/constants/assignment-status";
import { Subject, GradeLevel } from "@/constants/grade-subjects";
import { StudentAssignment, StudentDashboardFilters } from "@/types/student-dashboard";
import { pascalToCamelCase, spacesToCamelCase } from "./string-utils";

/**
 * Creates initial student dashboard filters
 */
export function initializeStudentFilters(availableSubjects: Subject[]): StudentDashboardFilters {
  // Initialize status filters
  const statusFilters = Object.values(ASSIGNMENT_STATUS).reduce((acc, status) => ({
    ...acc,
    [status.toLowerCase()]: false
  }), {});

  // Initialize subject filters based on grade-specific subjects
  const subjectFilters = availableSubjects.reduce((acc, subject) => ({
    ...acc,
    [subject.toLowerCase().replace(/\s+/g, '')]: false
  }), {});

  return { ...statusFilters, ...subjectFilters } as StudentDashboardFilters;
}

/**
 * Checks if an assignment matches the search query
 */
export function matchesStudentSearch(assignment: StudentAssignment, searchQuery: string): boolean {
  if (!searchQuery.trim()) return true;
  
  const query = searchQuery.toLowerCase().trim();
  const searchableText = [
    assignment.title,
    assignment.subject,
    assignment.status
  ].join(' ').toLowerCase();
  
  return searchableText.includes(query);
}

/**
 * Checks if an assignment matches the selected status filters
 */
export function matchesStudentStatusFilters(
  assignment: StudentAssignment,
  selectedFilters: StudentDashboardFilters
): boolean {
  const activeStatuses = Object.values(ASSIGNMENT_STATUS)
    .filter(status => selectedFilters[status.toLowerCase()]);
  
  if (activeStatuses.length === 0) return true;
  return activeStatuses.includes(assignment.status);
}

/**
 * Checks if an assignment matches the selected subject filters
 */
export function matchesStudentSubjectFilters(
  assignment: StudentAssignment,
  selectedFilters: StudentDashboardFilters,
  availableSubjects: Subject[]
): boolean {
  const activeSubjects = availableSubjects
    .filter(subject => selectedFilters[subject.toLowerCase().replace(/\s+/g, '')]);
  
  if (activeSubjects.length === 0) return true;
  return activeSubjects.includes(assignment.subject);
}

/**
 * Filters student assignments based on search query and filters
 */
export function filterStudentAssignments(
  assignments: StudentAssignment[],
  searchQuery: string,
  selectedFilters: StudentDashboardFilters,
  availableSubjects: Subject[]
): StudentAssignment[] {
  return assignments.filter(assignment => 
    matchesStudentSearch(assignment, searchQuery) &&
    matchesStudentStatusFilters(assignment, selectedFilters) &&
    matchesStudentSubjectFilters(assignment, selectedFilters, availableSubjects)
  );
}

/**
 * Gets the count of active filters
 */
export function getActiveStudentFilterCount(filters: StudentDashboardFilters): number {
  return Object.values(filters).filter(value => value).length;
}

/**
 * Checks if any student filters are active
 */
export function hasActiveStudentFilters(filters: StudentDashboardFilters): boolean {
  return Object.values(filters).some(value => value);
}

/**
 * Gets assignments for student's current grade
 */
export function getGradeAssignments(
  assignments: StudentAssignment[],
  grade: GradeLevel
): StudentAssignment[] {
  return assignments.filter(assignment => assignment.grade === grade);
} 