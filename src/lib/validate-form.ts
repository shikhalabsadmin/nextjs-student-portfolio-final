interface ValidationFormData {
  title: string;
  subject: string;
  artifact_type: string;
  month: string;
  is_team_work: boolean;
  team_contribution: string;
  is_original_work: boolean;
  originality_explanation: string;
  skills: string[];
  skills_justification: string;
  pride_reason: string;
  creation_process: string;
  learnings: string;
  challenges: string;
  improvements: string;
  acknowledgments: string;
  files: (File | string)[];
}

export const validateForm = (data: ValidationFormData): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.title.trim()) {
    errors.title = "Title is required";
  }

  if (!data.subject) {
    errors.subject = "Subject is required";
  }

  if (!data.artifact_type) {
    errors.artifact_type = "Type is required";
  }

  if (data.files.length === 0) {
    errors.files = "At least one file is required";
  }

  if (data.is_team_work && !data.team_contribution.trim()) {
    errors.team_contribution = "Team contribution description is required";
  }

  if (data.is_original_work && !data.originality_explanation.trim()) {
    errors.originality_explanation = "Originality explanation is required";
  }

  if (data.skills.length === 0) {
    errors.skills = "Select at least one skill";
  }

  return errors;
}; 