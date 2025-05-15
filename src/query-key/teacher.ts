/**
 * Query keys for teacher-related queries
 */
export const TEACHER_KEYS = {
  /**
   * Key for getting multiple teacher profiles by their IDs
   */
  profiles: (teacherIds: string[]) => 
    ['teacherProfiles', teacherIds.sort().join('-')] as const,
  
  /**
   * Key for getting assignments for verification by a teacher
   */
  assignmentsForVerification: (teacherId: string) => 
    ['teacher', teacherId, 'assignments', 'verification'] as const,
  
  /**
   * Key for a specific assignment being viewed by a teacher
   */
  assignmentView: (assignmentId: string) => 
    ['teacher', 'assignment', assignmentId] as const,
} as const; 