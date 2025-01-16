import { Database } from './supabase';

// Use the database Row type as our base Assignment type
export type Assignment = Database['public']['Tables']['assignments']['Row'] & {
  files?: AssignmentFile[];
  student: {
    id: string;
    full_name: string;
    grade: string;
  };
};

export type AssignmentStatus = 'DRAFT' | 'SUBMITTED' | 'VERIFIED';

export interface AssignmentFile {
  id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  created_at?: string;
  assignment_id?: string;
}

// Form state type - matches database schema
export interface FormAnswers {
  id?: string;  // The unique identifier for the assignment
  title: string;
  subject: string;
  grade: string;
  month: string;
  artifact_type: string;
  artifact_url?: string;
  artifact?: (File | string)[];
  files?: AssignmentFile[];
  is_team_work?: boolean;
  team_contribution?: string | null;
  is_original_work?: boolean;
  originality_explanation?: string | null;
  selected_skills?: string[];
  skills_justification?: string | null;
  pride_reason?: string | null;
  creation_process?: string | null;
  learnings?: string | null;
  challenges?: string | null;
  improvements?: string | null;
  acknowledgments?: string | null;
  status?: string;
  student_id?: string;
  teacher_id?: string | null;
  submitted_at?: string | null;
  verified_at?: string | null;
  feedback?: any;
  revision_history?: any[];
  current_revision?: number;
}

// Type for creating/updating assignments
export interface AssignmentFormData {
  id?: string;  // The unique identifier for the assignment
  title: string;
  subject: string;
  grade: string;
  month: string;
  artifact_type: string;
  artifact_url?: string | null;
  is_team_work?: boolean;
  team_contribution?: string | null;
  is_original_work?: boolean;
  originality_explanation?: string | null;
  selected_skills?: string[];
  skills_justification?: string | null;
  pride_reason?: string | null;
  creation_process?: string | null;
  learnings?: string | null;
  challenges?: string | null;
  improvements?: string | null;
  acknowledgments?: string | null;
  teacher_id?: string | null;
  status?: string;
  student_id?: string;
  submitted_at?: string | null;
  verified_at?: string | null;
  feedback?: any;
  revision_history?: any[];
  current_revision?: number;
} 