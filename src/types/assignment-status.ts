export const AssignmentStatus = {
  NOT_STARTED: 'NOT_STARTED',
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  VERIFIED: 'VERIFIED',
  PUBLISHED: 'PUBLISHED',
  NEEDS_REVISION: 'NEEDS_REVISION',
  REJECTED: 'REJECTED'
} as const;

export type AssignmentStatus = typeof AssignmentStatus[keyof typeof AssignmentStatus]; 