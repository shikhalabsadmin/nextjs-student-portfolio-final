import { SupabaseClient } from '@supabase/supabase-js';
import { FileOptions as SupabaseFileOptions } from '@supabase/storage-js';

export interface TeachingSubject {
  subject: string;
  grade: string;
}

export type AssignmentStatus = 'DRAFT' | 'SUBMITTED' | 'NEEDS_REVISION' | 'VERIFIED';

// Basic Database type for Supabase
export interface Database {
  public: {
    Tables: {
      assignments: {
        Row: {
          id: string;
          title: string;
          subject: string;
          grade: string;
          month: string;
          artifact_type: string;
          artifact_url: string | null;
          is_team_work: boolean;
          team_contribution: string | null;
          is_original_work: boolean;
          originality_explanation: string | null;
          selected_skills: string[];
          skills_justification: string | null;
          pride_reason: string | null;
          creation_process: string | null;
          learnings: string | null;
          challenges: string | null;
          improvements: string | null;
          acknowledgments: string | null;
          status: AssignmentStatus;
          student_id: string;
          teacher_id: string | null;
          submitted_at: string | null;
          verified_at: string | null;
          feedback: Json | null;
          revision_history: Json[];
          current_revision: number;
          created_at: string;
          updated_at: string;
        };
      };
      assignment_files: Record<string, any>;
      profiles: Record<string, any>;
      verifications: Record<string, any>;
      teacher_assessments: Record<string, any>;
      responses: Record<string, any>;
      skills: Record<string, any>;
      portfolio_themes: Record<string, any>;
      assignment_skills: Record<string, any>;
      assignment_templates: Record<string, any>;
      template_questions: Record<string, any>;
      notifications: Record<string, any>;
      question_imports: Record<string, any>;
    };
  };
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DbClient = SupabaseClient<Database>;

export interface FileOptions {
  cacheControl?: string;
  contentType?: string;
  duplex?: string;
  upsert?: boolean;
  onUploadProgress?: (progress: { loaded: number; total: number }) => void;
}