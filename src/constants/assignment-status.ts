export const ASSIGNMENT_STATUS = {
  DRAFT: 'DRAFT',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  OVERDUE: 'OVERDUE',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  NEEDS_REVISION: 'NEEDS_REVISION',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
} as const;

export type AssignmentStatus = typeof ASSIGNMENT_STATUS[keyof typeof ASSIGNMENT_STATUS];

// Subset for statuses where editing and navigation are restricted
export type RestrictedStatus = 
  | typeof ASSIGNMENT_STATUS.COMPLETED
  | typeof ASSIGNMENT_STATUS.SUBMITTED
  | typeof ASSIGNMENT_STATUS.UNDER_REVIEW
  | typeof ASSIGNMENT_STATUS.APPROVED;

// Subset for statuses where "Save & Continue" button is hidden
export type LockedForContinueStatus = 
  | typeof ASSIGNMENT_STATUS.SUBMITTED
  | typeof ASSIGNMENT_STATUS.UNDER_REVIEW;

// Status display names for UI
export const STATUS_DISPLAY_NAMES: Record<AssignmentStatus, string> = {
  [ASSIGNMENT_STATUS.DRAFT]: 'Draft',
  [ASSIGNMENT_STATUS.IN_PROGRESS]: 'In Progress',
  [ASSIGNMENT_STATUS.COMPLETED]: 'Completed',
  [ASSIGNMENT_STATUS.OVERDUE]: 'Overdue',
  [ASSIGNMENT_STATUS.SUBMITTED]: 'Submitted',
  [ASSIGNMENT_STATUS.UNDER_REVIEW]: 'Under Review',
  [ASSIGNMENT_STATUS.NEEDS_REVISION]: 'Needs Revision',
  [ASSIGNMENT_STATUS.APPROVED]: 'Approved',
  [ASSIGNMENT_STATUS.REJECTED]: 'Rejected'
};

// Status colors for UI badges
export const STATUS_COLORS: Record<AssignmentStatus, string> = {
  [ASSIGNMENT_STATUS.DRAFT]: 'bg-white text-[#344054] border border-[#D0D5DD]',
  [ASSIGNMENT_STATUS.IN_PROGRESS]: 'bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF]',
  [ASSIGNMENT_STATUS.COMPLETED]: 'bg-[#ECFDF3] text-[#027A48] border border-[#ABEFC6]',
  [ASSIGNMENT_STATUS.OVERDUE]: 'bg-[#FEF3F2] text-[#B42318] border border-[#FEC6C3]',
  [ASSIGNMENT_STATUS.SUBMITTED]: 'bg-[#F9F5FF] text-[#6941C6] border border-[#E9D7FE]',
  [ASSIGNMENT_STATUS.UNDER_REVIEW]: 'bg-[#FFF6ED] text-[#C4320A] border border-[#FFD6B8]',
  [ASSIGNMENT_STATUS.NEEDS_REVISION]: 'bg-[#FDF2FA] text-[#C11574] border border-[#FCCEEE]',
  [ASSIGNMENT_STATUS.APPROVED]: 'bg-[#ECFDF3] text-[#027A48] border border-[#ABEFC6]',
  [ASSIGNMENT_STATUS.REJECTED]: 'bg-[#FEF3F2] text-[#B42318] border border-[#FEC6C3]'
}; 