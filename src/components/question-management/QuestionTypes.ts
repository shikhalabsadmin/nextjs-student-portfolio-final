export interface Question {
  id?: string;
  label: string;
  type: string;
  grade_level?: number[];
  subject?: string[];
  options?: string[];
  required?: boolean;
  hint?: string;
  order_index: number;
  template_id?: string;
  created_at?: string;
}