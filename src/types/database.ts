// Only keep business logic interfaces that extend/modify base types
export interface Assignment {
  id: string;
  student_id?: string | null;
  teacher_id?: string | null;
  title: string;
  subject: string;
  grade: string;
  status: 'NOT_STARTED' | 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'PUBLISHED';
  description?: string | null;
  artifact_url?: string | null;
  artifact_type?: string | null;
  is_team_work?: boolean;
  is_original_work?: boolean;
  display_layout?: any | null;
  created_at?: string | null;
  updated_at?: string | null;
  is_parent?: boolean;
  parent_assignment_id?: string | null;
  month: string;
  selected_skills?: string[] | null;
  team_contribution?: string | null;
  originality_explanation?: string | null;
  skills_justification?: string | null;
  pride_reason?: string | null;
  creation_process?: string | null;
  learnings?: string | null;
  challenges?: string | null;
  improvements?: string | null;
  acknowledgments?: string | null;
  student?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    grade: string | null;
  };
} 