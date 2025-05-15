import { AssignmentFormValues, FeedbackItem } from "@/lib/validations/assignment";

export type TeacherFeedbackItem = {
    text?: string;
    date?: string;
    teacher_id?: string | null;
  };
  
  export type SkillsAssessment = {
    selected_skills: string[];
    skills_justification: string;
  };
  
  export type ExtendedFeedback = FeedbackItem;
  
 export interface ExtendedAssignmentFormValues extends AssignmentFormValues {
    feedback?: FeedbackItem[];
  }