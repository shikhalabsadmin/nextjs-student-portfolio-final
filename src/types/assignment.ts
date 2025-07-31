import type { LucideIcon } from "lucide-react";
import { AssignmentStatus } from '@/constants/assignment-status';

// API Types
// FileUploadResponse and FileRecordData are now imported from file.ts

// AssignmentFileInput and StorageFile are now imported from file.ts

export interface Assignment {
  id: string;
  student_id: string;
  teacher_id: string | null;
  title: string;
  subject: string;
  status: AssignmentStatus;
  created_at: string;
  artifact_type: string;
  artifact_url: string | null;
  description: string;
  files: string[];
  is_team_project: boolean;
  is_original_work: boolean;
  month: string;
  verifications?: {
    status: string;
    feedback: string;
    created_at: string;
    teacher: {
      email: string;
      subjects: string[];
      grade_levels: string[];
    }
  }[];
}

export interface AssignmentFormData {
  // Required fields
  id?: string;
  title: string;
  subject: string;
  grade: string;
  status: AssignmentStatus;

  // Optional fields
  is_parent?: boolean;
  parent_assignment_id?: string | null;
  submitted_at?: string | null;
  verified_at?: string | null;
  feedback?: Record<string, unknown> | null;
  revision_history?: Record<string, unknown>[] | null;
  current_revision?: number;
  month?: string;
  team_contribution?: string | null;
  originality_explanation?: string | null;
  selected_skills?: string[];
  skills_justification?: string | null;
  pride_reason?: string | null;
  creation_process?: string | null;
  learnings?: string | null;
  challenges?: string | null;
  improvements?: string | null;
  acknowledgments?: string | null;
  updated_at?: string;
  student_id?: string;
  teacher_id?: string | null;
  artifact_url?: string | null;
  artifact_type?: string | null;
  is_team_work?: boolean;
  is_original_work?: boolean;
  created_at?: string;
}

export type AssignmentStep = 
  | 'basic-info'
  | 'role-originality'
  | 'skills-reflection'
  | 'process-challenges'
  | 'review-submit'
  | 'assignment-preview'
  | 'teacher-feedback';

export interface StepConfig {
  id: AssignmentStep;
  title: string;
  header: string;
  description: string;
  icon?: LucideIcon;
} 