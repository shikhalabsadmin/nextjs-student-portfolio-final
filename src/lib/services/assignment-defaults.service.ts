import { ASSIGNMENT_STATUS } from "@/constants/assignment-status";
import { AssignmentFormValues } from "@/lib/validations/assignment";

export const getDefaultValues = (): Omit<AssignmentFormValues, 'files'> => ({
  title: "",
  subject: "",
  grade: "",
  status: ASSIGNMENT_STATUS.DRAFT,
  artifact_type: "",
  month: new Date().toISOString(),
  is_team_work: false,
  is_original_work: true,
  is_parent: false,
  artifact_url: "",
  team_contribution: "",
  selected_skills: [] as string[],
  skills_justification: "",
  pride_reason: "",
  creation_process: "",
  learnings: "",
  challenges: "",
  improvements: "",
  acknowledgments: "",
  feedback: {},
  youtubelinks: [],
  submitted_at: new Date().toISOString(),
  verified_at: new Date().toISOString(),
});