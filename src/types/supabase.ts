export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      assignment_drafts: {
        Row: {
          id: string;
          student_id: string;
          data: Json;
          last_modified: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          data: Json;
          last_modified?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          data?: Json;
          last_modified?: string;
          created_at?: string;
        };
      };
      assignments: {
        Row: {
          id: string;
          student_id: string;
          title: string;
          subject: string;
          artifact_type: string;
          artifact_url: string;
          month: string;
          status: string;
          is_team_project: boolean;
          team_contribution: string | null;
          is_original_work: boolean;
          originality_explanation: string | null;
          skills: string[];
          skills_justification: string | null;
          pride_reason: string | null;
          creation_process: string | null;
          learnings: string | null;
          challenges: string | null;
          improvements: string | null;
          acknowledgments: string | null;
          display_layout: Json;
          created_at: string;
          updated_at: string;
          grade: number;
        };
        Insert: {
          id?: string;
          student_id: string;
          title: string;
          subject: string;
          artifact_type: string;
          artifact_url: string;
          month: string;
          status?: string;
          is_team_project?: boolean;
          team_contribution?: string | null;
          is_original_work?: boolean;
          originality_explanation?: string | null;
          skills?: string[];
          skills_justification?: string | null;
          pride_reason?: string | null;
          creation_process?: string | null;
          learnings?: string | null;
          challenges?: string | null;
          improvements?: string | null;
          acknowledgments?: string | null;
          display_layout?: Json;
          created_at?: string;
          updated_at?: string;
          grade?: number;
        };
        Update: {
          id?: string;
          student_id?: string;
          title?: string;
          subject?: string;
          artifact_type?: string;
          artifact_url?: string;
          month?: string;
          status?: string;
          is_team_project?: boolean;
          team_contribution?: string | null;
          is_original_work?: boolean;
          originality_explanation?: string | null;
          skills?: string[];
          skills_justification?: string | null;
          pride_reason?: string | null;
          creation_process?: string | null;
          learnings?: string | null;
          challenges?: string | null;
          improvements?: string | null;
          acknowledgments?: string | null;
          display_layout?: Json;
          created_at?: string;
          updated_at?: string;
          grade?: number;
        };
      };
    };
  };
} 