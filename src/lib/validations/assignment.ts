import * as z from "zod";
import { AssignmentStatus } from "@/types/assignment-status";

// Schema for YouTube link objects
export const youtubeLinkSchema = z.object({
  url: z.string().optional().default(""),
  title: z.string().optional().default("")
}).strict();

// Schema for assignment files
export const assignmentFileSchema = z.object({
  id: z.string().optional().default(""),
  assignment_id: z.string().optional().default(""),
  file_url: z.string().optional().default(""),
  file_name: z.string().optional().default(""),
  file_type: z.string().optional().default(""),
  file_size: z.number().optional().default(0),
  created_at: z.string().optional().default(() => new Date().toISOString()),
  updated_at: z.string().optional().default(() => new Date().toISOString()),
  student_id: z.string().optional().default("")
}).strict();

// Schema for assignments
export const assignmentFormSchema = z.object({
  id: z.string().optional().default(""),
  title: z.string().min(1, "Title is required").max(255, "Title must be 255 characters or less").optional().default(""),
  subject: z.string().optional().default(""),
  grade: z.string().optional().default(""),
  status: z.nativeEnum(AssignmentStatus).optional().default(AssignmentStatus.DRAFT), // Assuming "draft" as a default status
  artifact_type: z.string().min(1, "Type of work is required").max(50, "Artifact type must be 50 characters or less").optional().default(""),
  month: z.string().min(1, "Month is required").max(10, "Month must be 10 characters or less").regex(/^(January|February|March|April|May|June|July|August|September|October|November|December)$/, "Must be a valid month").optional().default("March"), // Default to current month (March 2025)
  student_id: z.string().optional().default(""),
  is_team_work: z.boolean().optional().default(false),
  is_original_work: z.boolean().optional().default(true),
  created_at: z.string().optional().default(() => new Date().toISOString()),
  updated_at: z.string().optional().default(() => new Date().toISOString()),
  is_parent: z.boolean().optional().default(false),
  teacher_id: z.string().optional().default(""),
  artifact_url: z.string().optional().default(""),
  parent_assignment_id: z.string().optional().default(""),
  team_contribution: z.string().nullable().transform(val => val ?? "").optional().default(""),
  originality_explanation: z.string().nullable().transform(val => val ?? "").optional().default(""),
  selected_skills: z.array(z.string()).min(1, "Select at least one skill").max(3, "Select no more than three skills").default([]),
  skills_justification: z.string().nullable().transform(val => val ?? "").pipe(z.string().min(1, "Skill justification is required").max(200, "Must be 200 characters or less")).default(""),
  pride_reason: z.string().nullable().transform(val => val ?? "").pipe(z.string().min(1, "This field is required").max(200, "Must be 200 characters or less")).default(""),
  creation_process: z.string().nullable().transform(val => val ?? "").pipe(z.string().min(1, "This field is required").max(200, "Must be 200 characters or less")).default(""),
  learnings: z.string().nullable().transform(val => val ?? "").pipe(z.string().min(1, "This field is required").max(200, "Must be 200 characters or less")).default(""),
  challenges: z.string().nullable().transform(val => val ?? "").pipe(z.string().min(1, "This field is required").max(200, "Must be 200 characters or less")).default(""),
  improvements: z.string().nullable().transform(val => val ?? "").pipe(z.string().min(1, "This field is required").max(200, "Must be 200 characters or less")).default(""),
  acknowledgments: z.string().nullable().transform(val => val ?? "").pipe(z.string().min(1, "This field is required").max(200, "Must be 200 characters or less")).default(""),
  submitted_at: z.string().optional().default(() => new Date().toISOString()),
  verified_at: z.string().optional().default(() => new Date().toISOString()),
  feedback: z.record(z.unknown()).optional().default({}),
  revision_history: z.array(z.record(z.unknown())).optional().default([]),
  current_revision: z.number().optional().default(0),
  youtubelinks: z.array(youtubeLinkSchema).optional().default([{ url: "", title: "" }]),
  files: z.array(assignmentFileSchema).optional().default([])
}).strict();

// Type definition for the assignment form values
export type AssignmentFormValues = z.infer<typeof assignmentFormSchema>;