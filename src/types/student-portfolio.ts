import { GradeLevel, Subject } from "@/constants/grade-subjects";
import { AssignmentStatus } from "@/constants/assignment-status";

// ===== Data Types =====

/** Student profile data from API */
export interface StudentProfile {
  id: string;
  full_name: string | null;
  grade: GradeLevel | null;
  school_name: string | null;
  bio: string | null;
  image: string | null;
}

/** Assignment data for portfolio display */
export interface PortfolioAssignment {
  id: number;
  title: string;
  subject: Subject;
  grade: GradeLevel;
  due_date: string;
  status: AssignmentStatus;
  image_url?: string;
  student_id: string;
  updated_at: string;
}

/** File record from assignment files API */
export interface FileRecord {
  assignment_id: number;
  file_type: string;
  file_url: string;
  id: number;
}

// ===== Component Props =====

/** Props for ProfileAvatar component (simple - single className) */
export interface ProfileAvatarProps {
  image: string | null;
  name: string;
  showInitial: boolean;
  onImageError: () => void;
  /** Custom className for the avatar container */
  className?: string;
}

/** Style props for ProfileInfo component (complex - multiple elements) */
export interface ProfileInfoClassNames {
  container?: string;
  title?: string;
  badgeContainer?: string;
  badge?: string;
}

/** Props for ProfileInfo component */
export interface ProfileInfoProps {
  name: string;
  grade: string;
  schoolName: string;
  /** Custom classNames for different elements */
  classNames?: ProfileInfoClassNames;
}

/** Props for ProfileBio component (simple - single className) */
export interface ProfileBioProps {
  bio: string;
  /** Custom className for the bio paragraph */
  className?: string;
}

/** Style props for AssignmentsGrid component (complex - multiple elements) */
export interface AssignmentsGridClassNames {
  container?: string;
  cardWrapper?: string;
}

/** Props for AssignmentsGrid component */
export interface AssignmentsGridProps {
  assignments: PortfolioAssignment[];
  isBusy: boolean;
  onAssignmentClick: (id: number) => void;
  previewMode: boolean;
  /** Custom classNames for different elements */
  classNames?: AssignmentsGridClassNames;
}

/** Props for StudentPortfolioView (main view component) */
export interface StudentPortfolioViewProps {
  // Avatar props
  image: string | null;
  name: string;
  showInitial: boolean;
  onImageError: () => void;
  // Info props
  grade: string;
  schoolName: string;
  // Bio props
  bio: string;
  // Grid props
  assignments: PortfolioAssignment[];
  isBusy: boolean;
  onAssignmentClick: (id: number) => void;
  previewMode: boolean;
  /** Custom className for the view container */
  className?: string;
}
