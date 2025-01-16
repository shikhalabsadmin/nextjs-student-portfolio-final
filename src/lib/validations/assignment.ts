import { z } from "zod";

export const assignmentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  artifact_type: z.enum(["Project", "Essay", "Model", "Performance", "Presentation", "Other"], {
    required_error: "Please select a type",
  }),
  subject: z.enum(["Mathematics", "Science", "English", "History", "Art", "Music", "Physical Education", "Other"], {
    required_error: "Please select a subject",
  }),
  month: z.enum([
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ], {
    required_error: "Please select a month",
  }),
  grade: z.string({
    required_error: "Please select a grade",
  }),
  is_team_work: z.boolean(),
  team_contribution: z.string().nullable().optional(),
  is_original_work: z.boolean(),
  artifact_url: z.string().optional(),
  artifact: z.union([z.instanceof(File), z.array(z.union([z.instanceof(File), z.string()]))]).optional(),
  files: z.array(z.object({
    id: z.string(),
    file_url: z.string(),
    file_name: z.string(),
    file_size: z.number(),
    file_type: z.string(),
    created_at: z.string().optional(),
    assignment_id: z.string().optional()
  })).optional()
});

export type AssignmentFormData = z.infer<typeof assignmentSchema>;