export interface Assignment {
  id: string;
  student_id: string;
  teacher_id: string | null;
  title: string;
  subject: string;
  status: 'pending' | 'approved' | 'rejected';
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