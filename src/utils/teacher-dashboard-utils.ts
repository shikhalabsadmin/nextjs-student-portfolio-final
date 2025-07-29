import { Artifact } from "@/components/teacher/dashboard/ArtifactTable";
import { TeacherDashboardFilters, TeachingSubject } from "@/types/teacher-dashboard";
import { ASSIGNMENT_STATUS, AssignmentStatus } from "@/constants/assignment-status";
import { getMonthNameFromDate } from "@/constants/months-filter";

/**
 * Gets unique subjects from teaching subjects array
 */
export function getUniqueSubjectsFromTeachingSubjects(teachingSubjects?: TeachingSubject[]): string[] {
  if (!teachingSubjects || teachingSubjects.length === 0) {
    return [];
  }
  
  // Extract unique subjects from teaching_subjects with null/undefined checks
  return Array.from(
    new Set(teachingSubjects.map(item => item?.subject || "").filter(Boolean))
  );
}

/**
 * Gets unique grades from teaching subjects array
 */
export function getUniqueGradesFromTeachingSubjects(teachingSubjects?: TeachingSubject[]): string[] {
  if (!teachingSubjects || teachingSubjects.length === 0) {
    return [];
  }
  
  // Extract unique grades from teaching_subjects with null/undefined checks
  return Array.from(
    new Set(teachingSubjects.map(item => item?.grade || "").filter(Boolean))
  );
}

/**
 * Gets subjects for a specific grade from teaching subjects
 */
export function getSubjectsForGrade(grade: string, teachingSubjects?: TeachingSubject[]): string[] {
  if (!teachingSubjects || teachingSubjects.length === 0) {
    return [];
  }
  
  // Filter subjects that belong to the specified grade
  return Array.from(
    new Set(
      teachingSubjects
        .filter(item => item?.grade === grade)
        .map(item => item?.subject || "")
        .filter(Boolean)
    )
  );
}

/**
 * Gets grades for a specific subject from teaching subjects
 */
export function getGradesForSubject(subject: string, teachingSubjects?: TeachingSubject[]): string[] {
  if (!teachingSubjects || teachingSubjects.length === 0) {
    return [];
  }
  
  // Filter grades that have the specified subject
  return Array.from(
    new Set(
      teachingSubjects
        .filter(item => item?.subject === subject)
        .map(item => item?.grade || "")
        .filter(Boolean)
    )
  );
}

/**
 * Creates initial teacher dashboard filters
 */
export function initializeTeacherFilters(teachingSubjects?: TeachingSubject[]): TeacherDashboardFilters {
  // Initialize all status filters to false
  const statusFilters = Object.values(ASSIGNMENT_STATUS).reduce(
    (acc, status) => ({
      ...acc,
      [status]: false
    }),
    {} as Record<AssignmentStatus, boolean>
  );

  // Get subjects from user profile with safety check
  const subjects = getUniqueSubjectsFromTeachingSubjects(teachingSubjects);

  // Initialize subject filters (only if subjects are available)
  const subjectFilters = subjects.reduce(
    (acc, subject) => ({
      ...acc,
      [subject.toLowerCase().replace(/\s+/g, '')]: false
    }),
    {} as Record<string, boolean>
  );
  
  // Get grades from user profile with safety check
  const grades = getUniqueGradesFromTeachingSubjects(teachingSubjects);
  
  // Initialize grade filters (only if grades are available)
  const gradeFilters = grades.reduce(
    (acc, grade) => ({
      ...acc,
      [grade.toLowerCase().replace(/\s+/g, '')]: false
    }),
    {} as Record<string, boolean>
  );

  return { 
    status: statusFilters,
    subjects: subjectFilters,
    grades: gradeFilters,
    dateRange: undefined,
    timePeriod: undefined,
    months: undefined
  };
}

/**
 * Checks if an artifact matches the selected status filters
 */
export function matchesStatusFilters(
  artifact: Artifact,
  selectedFilters: TeacherDashboardFilters
): boolean {
  // Ensure the filters exist
  if (!selectedFilters?.status) {
    return true;
  }
  
  const activeStatuses = Object.entries(selectedFilters.status || {})
    .filter(([_, isActive]) => isActive)
    .map(([status]) => status);
  
  // If no active status filters, don't filter by status
  if (activeStatuses.length === 0) {
    return true;
  }

  return activeStatuses.includes(artifact?.status);
}

/**
 * Checks if an artifact matches the selected subject filters
 */
export function matchesSubjectFilters(
  artifact: Artifact,
  selectedFilters: TeacherDashboardFilters,
  teachingSubjects?: TeachingSubject[]
): boolean {
  // Safety checks
  if (!artifact?.subject || !selectedFilters?.subjects) {
    return true;
  }
  
  const subjectKey = (artifact.subject || "").toLowerCase().replace(/\s+/g, '');
  
  // Get active subject filters
  const activeSubjects = Object.entries(selectedFilters.subjects || {})
    .filter(([_, isActive]) => isActive)
    .map(([subject]) => subject);
  
  // If no active subject filters, don't filter by subject
  if (activeSubjects.length === 0) {
    return true;
  }

  // Check if the artifact's subject matches any active subject filter
  return activeSubjects.includes(subjectKey);
}

/**
 * Checks if an artifact matches the selected grade filters
 */
export function matchesGradeFilters(
  artifact: Artifact,
  selectedFilters: TeacherDashboardFilters,
  teachingSubjects?: TeachingSubject[]
): boolean {
  // Safety checks
  if (!artifact?.grade || !selectedFilters?.grades) {
    return true;
  }
  
  const gradeKey = (artifact.grade || "").toLowerCase().replace(/\s+/g, '');
  
  // Get active grade filters
  const activeGrades = Object.entries(selectedFilters.grades || {})
    .filter(([_, isActive]) => isActive)
    .map(([grade]) => grade);
  
  // If no active grade filters, don't filter by grade
  if (activeGrades.length === 0) {
    return true;
  }

  // Check if the artifact's grade matches any active grade filter
  return activeGrades.includes(gradeKey);
}

/**
 * Checks if an artifact matches the date range filter
 */
function matchesDateRangeFilter(artifact: Artifact, filters: TeacherDashboardFilters): boolean {
  if (!filters.dateRange) return true;
  
  const { from, to } = filters.dateRange;
  if (!from && !to) return true;
  
  // Use created or lastUpdated for date comparison
  const artifactDate = new Date(artifact.created || artifact.lastUpdated || '');
  if (isNaN(artifactDate.getTime())) return true; // Invalid date, include by default
  
  if (from && artifactDate < from) return false;
  if (to && artifactDate > to) return false;
  
  return true;
}

/**
 * Checks if an artifact matches the month filter
 */
function matchesMonthFilter(artifact: Artifact, filters: TeacherDashboardFilters): boolean {
  if (!filters.months) return true;
  
  // Check if any months are selected
  const selectedMonths = Object.entries(filters.months).filter(([_, isSelected]) => isSelected).map(([month]) => month);
  if (selectedMonths.length === 0) return true;
  
  // Use created or lastUpdated for date comparison
  const artifactDate = new Date(artifact.created || artifact.lastUpdated || '');
  if (isNaN(artifactDate.getTime())) return true; // Invalid date, include by default
  
  const artifactMonth = getMonthNameFromDate(artifactDate);
  return selectedMonths.includes(artifactMonth);
}

/**
 * Filters artifacts based on search query and filters
 */
export function filterArtifacts(
  artifacts: Artifact[],
  searchQuery: string,
  selectedFilters: TeacherDashboardFilters,
  teachingSubjects?: TeachingSubject[]
): Artifact[] {
  if (!artifacts || artifacts.length === 0) {
    return [];
  }
  
  // Ensure we have valid filters
  const filters = selectedFilters || initializeTeacherFilters(teachingSubjects);
  const query = searchQuery || "";
  
  return artifacts.filter(artifact => 
    matchesSearch(artifact, query) &&
    matchesStatusFilters(artifact, filters) &&
    matchesSubjectFilters(artifact, filters, teachingSubjects) &&
    matchesGradeFilters(artifact, filters, teachingSubjects) &&
    matchesDateRangeFilter(artifact, filters) &&
    matchesMonthFilter(artifact, filters)
  );
}

/**
 * Gets the count of active teacher filters
 * @param filters - The filters to count
 * @returns Number of active filters
 */
export function getActiveTeacherFilterCount(filters?: TeacherDashboardFilters): number {
  if (!filters) return 0;
  
  let count = 0;
  
  // Count boolean filters (status, subject, and grade filters)
  ['status', 'subjects', 'grades'].forEach(filterType => {
    const filterGroup = filters[filterType as keyof TeacherDashboardFilters] as Record<string, boolean>;
    if (filterGroup) {
      count += Object.values(filterGroup).filter(Boolean).length;
    }
  });
  
  // Count time-based filters
  if (filters.timePeriod) {
    count++;
  }
  
  // Count month filters
  if (filters.months) {
    count += Object.values(filters.months).filter(Boolean).length;
  }
  
  return count;
}

/**
 * Checks if any teacher filters are active
 * @param filters - The filters to check
 * @returns Boolean indicating if any filters are active
 */
export function hasActiveTeacherFilters(filters?: TeacherDashboardFilters): boolean {
  return getActiveTeacherFilterCount(filters) > 0;
}

/**
 * Checks if an artifact matches the search query
 */
export function matchesSearch(artifact: Artifact, searchQuery: string): boolean {
  if (!searchQuery) {
    return true;
  }
  
  // Safety checks for all properties
  const query = (searchQuery || "").toLowerCase();
  const name = (artifact?.name || "").toLowerCase();
  const subject = (artifact?.subject || "").toLowerCase();
  const studentName = (artifact?.studentName || "").toLowerCase();
  const className = (artifact?.class || "").toLowerCase();
  const grade = (artifact?.grade || "").toLowerCase();
  
  return (
    name.includes(query) ||
    subject.includes(query) ||
    studentName.includes(query) ||
    className.includes(query) ||
    grade.includes(query)
  );
}

/**
 * Gets the count of active filters
 */
export function getActiveFilterCount(filters: TeacherDashboardFilters): number {
  // Use the new helper function
  return getActiveTeacherFilterCount(filters);
}

/**
 * Checks if any filters are active
 */
export function hasActiveFilters(filters: TeacherDashboardFilters): boolean {
  // Safety checks
  if (!filters) return false;
  
  return (
    Object.values(filters.status || {}).some(Boolean) ||
    Object.values(filters.subjects || {}).some(Boolean) ||
    Object.values(filters.grades || {}).some(Boolean)
  );
} 