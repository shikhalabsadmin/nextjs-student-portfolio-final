export interface ThemeColors {
  text: string;
  accent: string;
  primary: string;
  secondary: string;
  background: string;
  [key: string]: string;
}

export interface Typography {
  scale: 'compact' | 'regular' | 'spacious';
  bodyFont: string;
  headingFont: string;
  [key: string]: string;
}

export interface Layout {
  style: 'minimal' | 'creative' | 'academic';
  spacing: 'tight' | 'balanced' | 'airy';
  [key: string]: string;
}

export interface PortfolioTheme {
  colors: ThemeColors;
  typography: Typography;
  layout: Layout;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  grade: string;
  artifact_type: string;
  artifact_url: string | null;
  month: string;
  created_at: string;
  description?: string | null;
  selected_skills?: string[] | null;
  is_team_work?: boolean;
  team_contribution?: string | null;
  is_original_work?: boolean;
  originality_explanation?: string | null;
  skills_justification?: string | null;
  pride_reason?: string | null;
  creation_process?: string | null;
  learnings?: string | null;
  challenges?: string | null;
  improvements?: string | null;
  acknowledgments?: string | null;
}