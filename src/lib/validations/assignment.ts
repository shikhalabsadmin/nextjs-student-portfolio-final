import { z } from "zod";

export const assignmentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  type: z.enum(["Project", "Essay", "Model", "Performance", "Presentation", "Other"], {
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
  is_team_project: z.boolean(),
  team_description: z.string().optional(),
  is_original_work: z.boolean(),
  originality_description: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  artifact: z.instanceof(File, { message: "Please upload your work" }),
});

export type AssignmentFormData = z.infer<typeof assignmentSchema>;