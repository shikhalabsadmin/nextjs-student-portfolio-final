/**
 * Query keys for Student Portfolio page
 * 
 * Usage:
 * useQuery({ queryKey: STUDENT_PORTFOLIO_KEYS.studentInfo("student-123"), ... })
 */
export const STUDENT_PORTFOLIO_KEYS = {
  /**
   * Key for student profile info
   */
  studentInfo: (studentId: string) => ["studentInfo", studentId] as const,

  /**
   * Key for approved assignments
   */
  approvedAssignments: (studentId: string) => ["assignments", studentId, "approved"] as const,

  /**
   * Key for assignment files (images)
   */
  assignmentFiles: (assignmentIds: string[]) => ["assignmentFiles", assignmentIds] as const,
} as const;
