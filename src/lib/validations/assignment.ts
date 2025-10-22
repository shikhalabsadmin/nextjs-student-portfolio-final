import * as z from "zod";
import { ASSIGNMENT_STATUS } from "@/constants/assignment-status";
// Remove the circular import
// import { ExtendedAssignmentFormValues } from "@/types/teacher/hooks/useSingleAssignmentView";
// Schema for YouTube link objects
export const youtubeLinkSchema = z.object({
  url: z.string().optional().default(""),
  title: z.string().optional().default("")
}).strict();

// Schema for external link objects
export const externalLinkSchema = z.object({
  url: z.string().optional().default(""),
  title: z.string().optional().default(""),
  type: z.string().optional().default("")
}).strict();

// Schema for question-level comments
export const questionCommentSchema = z.object({
  id: z.string(),
  comment: z.string(),
  timestamp: z.string(),
  teacher_id: z.string(),
  question_id: z.string(),
}).strict();

// Schema for feedback items
export const feedbackItemSchema = z.object({
  text: z.string().optional().default(""),
  date: z.string().optional().default(() => new Date().toISOString()),
  teacher_id: z.string().nullable().optional(),
  selected_skills: z.array(z.string()).optional().default([]),
  skills_justification: z.string().optional().default(""),
  question_comments: z.record(z.string(), questionCommentSchema).optional().default({}),
}).strict();

// Schema for assignment files
export const assignmentFileSchema = z.object({
  id: z.string().optional(),
  student_id: z.string().optional().default(""),
  assignment_id: z.string().optional().default(""),
  file_url: z.string().optional().default(""),
  file_name: z.string().optional().default(""),
  file_type: z.string().optional().default(""),
  file_size: z.number().optional().default(0),
  created_at: z.string().optional().default(() => new Date().toISOString()),
  updated_at: z.string().optional().default(() => new Date().toISOString()),
  is_process_documentation: z.boolean().optional().default(false),
  uploadProgress: z.number().optional(),
}).strict();


// Base schema for loading (permissive)
export const baseAssignmentFormSchema = z.object({
  id: z.string().optional(),
  student_id: z.string().optional().default(""),
  title: z.string().optional().default(""),
  subject: z.string().optional().default(""),
  grade: z.string().optional().default(""),
  status: z.nativeEnum(ASSIGNMENT_STATUS).optional().default(ASSIGNMENT_STATUS.DRAFT),
  artifact_url: z.string().optional().default(""),
  artifact_type: z.string().optional().default(""),
  is_team_work: z.boolean().optional().default(false),
  is_original_work: z.boolean().optional().default(true),
  created_at: z.string().optional().default(() => new Date().toISOString()),
  updated_at: z.string().optional().default(() => new Date().toISOString()),
  is_parent: z.boolean().optional().default(false),
  month: z.string().optional(),
  team_contribution: z.string().optional().default(""),
  selected_skills: z.array(z.string()).optional().default([]),
  skills_justification: z.string().optional().default(""),
  pride_reason: z.string().optional().default(""),
  creation_process: z.string().optional().default(""),
  learnings: z.string().optional().default(""),
  challenges: z.string().optional().default(""),
  improvements: z.string().optional().default(""),
  acknowledgments: z.string().optional().default(""),
  submitted_at: z.string().optional().default(() => new Date().toISOString()),
  verified_at: z.string().nullable().optional().default(() => new Date().toISOString()),
  feedback: z.array(feedbackItemSchema).optional().default([]),
  youtubelinks: z.array(youtubeLinkSchema).optional().default([]),
  externalLinks: z.array(externalLinkSchema).optional().default([]),
  files: z.array(assignmentFileSchema).optional().default([]),
  originality_explanation: z.string().optional().default(""),
});

// Helper function to check HTML content
const isHtmlContentValid = (content: string | undefined | null): boolean => {
  if (!content) return false;
  // Remove HTML tags and check if there's actual text content
  const textContent = content.replace(/<[^>]*>/g, '').trim();
  return textContent.length > 0;
};

// Strict schema for submission
export const assignmentFormSchema = baseAssignmentFormSchema.extend({
  title: z.string().min(1, "Title is required").max(255, "Title must be 255 characters or less"),
  subject: z.string().min(1, "Subject is required"),
  grade: z.string().min(1, "Grade is required"),
  artifact_type: z.string().min(1, "Type of work is required"),
  month: z.string().optional(),
  selected_skills: z.array(z.string()).min(1, "Select at least one skill"),
  skills_justification: z.string().max(10000, "Content is too long")
    .refine(isHtmlContentValid, "Skill justification is required"),
  pride_reason: z.string().max(10000, "Content is too long")
    .refine(isHtmlContentValid, "This field is required"),
  creation_process: z.string().max(10000, "Content is too long")
    .refine(isHtmlContentValid, "This field is required"),
  learnings: z.string().max(10000, "Content is too long")
    .refine(isHtmlContentValid, "This field is required"),
  challenges: z.string().max(10000, "Content is too long")
    .refine(isHtmlContentValid, "This field is required"),
  improvements: z.string().max(10000, "Content is too long")
    .refine(isHtmlContentValid, "This field is required"),
  acknowledgments: z.string().max(10000, "Content is too long")
    .refine(isHtmlContentValid, "This field is required"),
}).superRefine((data, ctx) => {
  // Validate team contribution is provided if team work is selected
  if (data.is_team_work && !isHtmlContentValid(data.team_contribution)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Team contribution is required for team work",
      path: ["team_contribution"],
    });
  }
  
  // Validate originality explanation is provided if original work is selected
  if (data.is_original_work && !isHtmlContentValid(data.originality_explanation)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please explain what makes your work original",
      path: ["originality_explanation"],
    });
  }

  // Validate that at least one file or external link is provided
  const hasFiles = data.files && data.files.length > 0 && data.files.some(f => f.file_url);
  const hasExternalLinks = data.externalLinks && data.externalLinks.length > 0 && data.externalLinks.some(l => l.url);
  const hasYoutubeLinks = data.youtubelinks && data.youtubelinks.length > 0 && data.youtubelinks.some(l => l.url);
  
  if (!hasFiles && !hasExternalLinks && !hasYoutubeLinks) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "At least one file or link must be uploaded",
      path: ["files"],
    });
  }
});

// Type inference
export type AssignmentFormValues = z.infer<typeof baseAssignmentFormSchema>;
export type FeedbackItem = z.infer<typeof feedbackItemSchema>;
export type QuestionComment = z.infer<typeof questionCommentSchema>;
export type AssignmentFile = z.infer<typeof assignmentFileSchema>;
export type YoutubeLink = z.infer<typeof youtubeLinkSchema>;
export type ExternalLink = z.infer<typeof externalLinkSchema>;