import type { LucideIcon } from "lucide-react";

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