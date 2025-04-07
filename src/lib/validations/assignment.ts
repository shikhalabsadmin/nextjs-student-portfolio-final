import * as z from "zod";
import { ASSIGNMENT_STATUS } from "@/constants/assignment-status";

// Schema for YouTube link objects
export const youtubeLinkSchema = z.object({
  url: z.string().optional().default(""),
  title: z.string().optional().default("")
}).strict();

// Schema for assignment files
export const assignmentFileSchema = z.object({
  id: z.string().uuid().optional(),
  assignment_id: z.string().optional(),
  file_url: z.string().optional().default(""),
  file_name: z.string().optional().default(""),
  file_type: z.string().optional().default(""),
  file_size: z.number().optional().default(0),
  created_at: z.string().optional().default(() => new Date().toISOString()),
  updated_at: z.string().optional().default(() => new Date().toISOString()),
  student_id: z.string().optional()
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
  month: z.string().optional().default(new Date().toLocaleString('default', { month: 'long' })),
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
  verified_at: z.string().optional().default(() => new Date().toISOString()),
  feedback: z.record(z.unknown()).optional().default({}),
  youtubelinks: z.array(youtubeLinkSchema).optional().default([]),
  files: z.array(assignmentFileSchema).optional().default([])
});

// Strict schema for submission
export const assignmentFormSchema = baseAssignmentFormSchema.extend({
  title: z.string().min(1, "Title is required").max(255, "Title must be 255 characters or less"),
  subject: z.string().min(1, "Subject is required"),
  grade: z.string().min(1, "Grade is required"),
  artifact_type: z.string().min(1, "Type of work is required"),
  month: z.string().min(1, "Month is required").regex(/^(January|February|March|April|May|June|July|August|September|October|November|December)$/, "Must be a valid month"),
  selected_skills: z.array(z.string()).min(1, "Select at least one skill"),
  skills_justification: z.string().min(1, "Skill justification is required").max(200, "Must be 200 characters or less"),
  pride_reason: z.string().min(1, "This field is required").max(200, "Must be 200 characters or less"),
  creation_process: z.string().min(1, "This field is required").max(200, "Must be 200 characters or less"),
  learnings: z.string().min(1, "This field is required").max(200, "Must be 200 characters or less"),
  challenges: z.string().min(1, "This field is required").max(200, "Must be 200 characters or less"),
  improvements: z.string().min(1, "This field is required").max(200, "Must be 200 characters or less"),
  acknowledgments: z.string().min(1, "This field is required").max(200, "Must be 200 characters or less"),
});

export type AssignmentFormValues = z.infer<typeof assignmentFormSchema>;