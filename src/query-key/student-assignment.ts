export const ASSIGNMENT_KEYS = {
  /**
   * Key for an individual assignment by ID
   */
  detail: (assignmentId: string) => ['assignment', assignmentId] as const,
  
  /**
   * Key for a list of assignments by student ID
   */
  list: (studentId: string) => ['assignments', studentId] as const,
  
  /**
   * Key for all assignments
   */
  all: () => ['assignments'] as const,
} as const;
