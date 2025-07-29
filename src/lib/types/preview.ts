import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFormValues } from "@/lib/validations/assignment";

export interface PreviewStepProps {
  form: UseFormReturn<AssignmentFormValues>;
}

export interface PreviewSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export interface PreviewFieldProps {
  label: string;
  value: string | string[] | boolean | null | undefined;
  className?: string;
}

export interface FileItem {
  file_name?: string;
  file_url?: string;
  id?: string;
  student_id?: string;
  created_at?: string;
  updated_at?: string;
  assignment_id?: string;
  file_type?: string;
  file_size?: number;
  is_process_documentation?: boolean;
}

export interface ExternalLink {
  url?: string;
  title?: string;
  type?: string;
}

// Legacy type kept for backward compatibility
export interface YoutubeLink {
  url?: string;
  title?: string;
} 