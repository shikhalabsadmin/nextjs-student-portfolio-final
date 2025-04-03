export const ASSIGNMENT_STATUS = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  NEEDS_REVISION: "NEEDS_REVISION",
  APPROVED: "APPROVED",
} as const;

export type AssignmentStatus =
  (typeof ASSIGNMENT_STATUS)[keyof typeof ASSIGNMENT_STATUS];

// Subset for statuses where editing and navigation are restricted
export type RestrictedStatus =
  | typeof ASSIGNMENT_STATUS.SUBMITTED
  | typeof ASSIGNMENT_STATUS.APPROVED;

// Subset for statuses where "Save & Continue" button is hidden
export type LockedForContinueStatus = typeof ASSIGNMENT_STATUS.SUBMITTED;

// Status display names for UI
export const STATUS_DISPLAY_NAMES: Record<AssignmentStatus, string> = {
  [ASSIGNMENT_STATUS.DRAFT]: "Draft",

  [ASSIGNMENT_STATUS.SUBMITTED]: "Submitted",

  [ASSIGNMENT_STATUS.NEEDS_REVISION]: "Needs Revision",
  [ASSIGNMENT_STATUS.APPROVED]: "Approved",
};

// Status colors for UI badges
export const STATUS_COLORS: Record<AssignmentStatus, string> = {
  [ASSIGNMENT_STATUS.DRAFT]: "bg-white text-[#344054] border border-[#D0D5DD]",
  [ASSIGNMENT_STATUS.SUBMITTED]:
    "bg-[#F9F5FF] text-[#6941C6] border border-[#E9D7FE]",
  [ASSIGNMENT_STATUS.NEEDS_REVISION]:
    "bg-[#FDF2FA] text-[#C11574] border border-[#FCCEEE]",
  [ASSIGNMENT_STATUS.APPROVED]:
    "bg-[#ECFDF3] text-[#027A48] border border-[#ABEFC6]",
};
