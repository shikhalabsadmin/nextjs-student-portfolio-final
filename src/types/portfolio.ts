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
  artifact_type: string;
  month: string;
  artifact_url: string | null;
  created_at: string;
}