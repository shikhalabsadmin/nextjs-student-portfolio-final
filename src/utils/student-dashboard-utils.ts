import { ASSIGNMENT_STATUS } from "@/constants/assignment-status";
import { Subject, GradeLevel } from "@/constants/grade-subjects";
import { StudentAssignment, StudentDashboardFilters } from "@/types/student-dashboard";
import { pascalToCamelCase, spacesToCamelCase } from "./string-utils";

/**
 * Creates initial student dashboard filters with all options set to false
 * @param availableSubjects - List of subjects available for the current grade
 * @returns StudentDashboardFilters object with all options initialized to false
 */
export function initializeStudentFilters(availableSubjects: Subject[]): StudentDashboardFilters {
  // Initialize status filters
  const statusFilters = Object.values(ASSIGNMENT_STATUS).reduce((acc, status) => ({
    ...acc,
    [status.toLowerCase()]: false
  }), {});

  // Initialize subject filters based on grade-specific subjects
  const subjectFilters = availableSubjects?.reduce?.((acc, subject) => ({
    ...acc,
    [spacesToCamelCase(subject)]: false
  }), {}) ?? {};

  return { ...statusFilters, ...subjectFilters } as StudentDashboardFilters;
}

/**
 * Checks if an assignment matches the search query
 * @param assignment - The assignment to check
 * @param searchQuery - Text-based search query
 * @returns Boolean indicating if the assignment matches the search
 */
export function matchesStudentSearch(assignment: StudentAssignment, searchQuery: string): boolean {
  if (!searchQuery?.trim()) return true;
  
  const query = searchQuery.toLowerCase().trim();
  const searchableText = [
    assignment?.title,
    assignment?.subject,
    assignment?.status
  ].filter(Boolean).join(' ').toLowerCase();
  
  return searchableText.includes(query);
}

/**
 * Checks if an assignment matches the selected status filters
 * @param assignment - The assignment to check against filters
 * @param selectedFilters - The currently applied dashboard filters
 * @returns Boolean indicating if the assignment matches the status filters
 */
export function matchesStudentStatusFilters(
  assignment: StudentAssignment,
  selectedFilters: StudentDashboardFilters
): boolean {
  // Get active statuses by checking which ones are marked true in selectedFilters
  const activeStatuses = Object.values(ASSIGNMENT_STATUS)
    .filter(status => selectedFilters?.[status.toLowerCase()]);
  
  // If no status filters are active, return all assignments
  if (!activeStatuses?.length) return true;
  
  // Check if the assignment's status is in the list of active statuses
  return activeStatuses.includes(assignment?.status);
}

/**
 * Checks if an assignment matches the selected subject filters
 * @param assignment - The assignment to check against filters
 * @param selectedFilters - The currently applied dashboard filters
 * @param availableSubjects - List of available subject options for the current grade
 * @returns Boolean indicating if the assignment matches the subject filters
 */
export function matchesStudentSubjectFilters(
  assignment: StudentAssignment,
  selectedFilters: StudentDashboardFilters,
  availableSubjects: Subject[]
): boolean {
  // If no subjects available or empty array, don't filter
  if (!availableSubjects?.length) return true;
  
  // Get active subjects by checking which ones are marked true in selectedFilters
  const activeSubjects = availableSubjects
    .filter(subject => selectedFilters?.[spacesToCamelCase(subject)]);
  
  // If no subject filters are active, return all assignments
  if (!activeSubjects?.length) return true;
  
  // Check if the assignment's subject is in the list of active subjects
  return activeSubjects.includes(assignment?.subject);
}

/**
 * Filters student assignments based on search query and filters
 * @param assignments - Array of assignments to filter
 * @param searchQuery - Text-based search query
 * @param selectedFilters - The currently applied dashboard filters
 * @param availableSubjects - List of available subject options for the current grade
 * @returns Filtered array of assignments
 */
export function filterStudentAssignments(
  assignments: StudentAssignment[],
  searchQuery: string,
  selectedFilters: StudentDashboardFilters,
  availableSubjects: Subject[]
): StudentAssignment[] {
  // Return empty array if no assignments provided
  if (!assignments?.length) return [];
  
  return assignments.filter(assignment => 
    // Apply text-based search filter
    matchesStudentSearch(assignment, searchQuery || '') &&
    // Apply status-based filters
    matchesStudentStatusFilters(assignment, selectedFilters) &&
    // Apply subject-based filters
    matchesStudentSubjectFilters(assignment, selectedFilters, availableSubjects || [])
  );
}

/**
 * Gets the count of active filters
 * @param filters - The filters to count
 * @returns Number of active (true) filters
 */
export function getActiveStudentFilterCount(filters?: StudentDashboardFilters): number {
  return Object.values(filters || {}).filter(Boolean).length;
}

/**
 * Checks if any student filters are active
 * @param filters - The filters to check
 * @returns Boolean indicating if any filters are active
 */
export function hasActiveStudentFilters(filters?: StudentDashboardFilters): boolean {
  return Object.values(filters || {}).some(Boolean);
}

/**
 * Gets assignments for student's current grade
 * @param assignments - All available assignments
 * @param grade - The student's current grade
 * @returns Filtered assignments for the specified grade
 */
export function getGradeAssignments(
  assignments: StudentAssignment[],
  grade?: GradeLevel
): StudentAssignment[] {
  if (!assignments?.length || !grade) return [];
  return assignments.filter(assignment => assignment?.grade === grade);
} 