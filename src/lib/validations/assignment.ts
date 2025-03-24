import * as z from "zod";
import { ASSIGNMENT_STATUS, AssignmentStatus } from "@/constants/assignment-status";

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
  title: z.string().default(""),
  subject: z.string().optional().default(""),
  grade: z.string().optional().default(""),
  status: z.nativeEnum(ASSIGNMENT_STATUS).optional().default(ASSIGNMENT_STATUS.DRAFT),
  artifact_type: z.string().default(""),
  month: z.string().default("March"),
  student_id: z.string().optional(),
  is_team_work: z.boolean().optional().default(false),
  is_original_work: z.boolean().optional().default(true),
  created_at: z.string().optional().default(() => new Date().toISOString()),
  updated_at: z.string().optional().default(() => new Date().toISOString()),
  is_parent: z.boolean().optional().default(false),
  teacher_id: z.string().optional(),
  artifact_url: z.string().nullable().default(""),
  parent_assignment_id: z.string().optional(),
  team_contribution: z.string().nullable().default(""),
  originality_explanation: z.string().nullable().default(""),
  selected_skills: z.array(z.string()).default([]),
  skills_justification: z.string().nullable().default(""),
  pride_reason: z.string().nullable().default(""),
  creation_process: z.string().nullable().default(""),
  learnings: z.string().nullable().default(""),
  challenges: z.string().nullable().default(""),
  improvements: z.string().nullable().default(""),
  acknowledgments: z.string().nullable().default(""),
  submitted_at: z.string().nullable().default(() => new Date().toISOString()),
  verified_at: z.string().nullable().default(() => new Date().toISOString()),
  feedback: z.record(z.unknown()).nullable().default({}),
  revision_history: z.array(z.record(z.unknown())).optional().default([]),
  youtubelinks: z.array(youtubeLinkSchema).optional().default([{ url: "", title: "" }]),
  files: z.array(assignmentFileSchema).optional().default([])
});

// Strict schema for submission
export const assignmentFormSchema = baseAssignmentFormSchema.extend({
  title: z.string().min(1, "Title is required").max(255, "Title must be 255 characters or less"),
  artifact_type: z.string().min(1, "Type of work is required").max(50, "Artifact type must be 50 characters or less"),
  month: z.string().min(1, "Month is required").max(10, "Month must be 10 characters or less").regex(/^(January|February|March|April|May|June|July|August|September|October|November|December)$/, "Must be a valid month"),
  selected_skills: z.array(z.string()).min(1, "Select at least one skill").max(3, "Select no more than three skills"),
  skills_justification: z.string().min(1, "Skill justification is required").max(200, "Must be 200 characters or less"),
  pride_reason: z.string().min(1, "This field is required").max(200, "Must be 200 characters or less"),
  creation_process: z.string().min(1, "This field is required").max(200, "Must be 200 characters or less"),
  learnings: z.string().min(1, "This field is required").max(200, "Must be 200 characters or less"),
  challenges: z.string().min(1, "This field is required").max(200, "Must be 200 characters or less"),
  improvements: z.string().min(1, "This field is required").max(200, "Must be 200 characters or less"),
  acknowledgments: z.string().min(1, "This field is required").max(200, "Must be 200 characters or less"),
});

export type AssignmentFormValues = z.infer<typeof assignmentFormSchema>;