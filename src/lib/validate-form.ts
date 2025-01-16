interface ValidationFormData {
  title: string;
  subject: string;
  artifact_type: string;
  month: string;
  grade: string;
  is_team_work: boolean;
  team_contribution: string;
  is_original_work: boolean;
  originality_explanation: string;
  selected_skills: string[];
  skills_justification: string;
  pride_reason: string;
  creation_process: string;
  learnings: string;
  challenges: string;
  improvements: string;
  acknowledgments: string;
  files: (File | string)[];
}

export const validateForm = (data: ValidationFormData, step: number = 1): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Step 1: Basic Information
  if (step === 1) {
    if (!data.title.trim()) {
      errors.title = "Title is required";
    }
    if (!data.subject) {
      errors.subject = "Subject is required";
    }
    if (!data.artifact_type) {
      errors.artifact_type = "Type is required";
    }
    if (!data.grade) {
      errors.grade = "Grade is required";
    }
    if (data.files.length === 0) {
      errors.files = "At least one file is required";
    }
  }

  // Step 2: Collaboration and Originality
  if (step === 2) {
    if (data.is_team_work && !data.team_contribution?.trim()) {
      errors.team_contribution = "Team contribution description is required";
    }
    if (data.is_original_work && !data.originality_explanation?.trim()) {
      errors.originality_explanation = "Originality explanation is required";
    }
  }

  // Step 3: Skills and Pride
  if (step === 3) {
    if (!data.selected_skills?.length) {
      errors.selected_skills = "Select at least one skill";
    }
    if (!data.skills_justification?.trim()) {
      errors.skills_justification = "Skills justification is required";
    }
    if (!data.pride_reason?.trim()) {
      errors.pride_reason = "Pride reason is required";
    }
  }

  // Step 4: Process, Learning, and Reflection
  if (step === 4) {
    if (!data.creation_process?.trim()) {
      errors.creation_process = "Creation process is required";
    }
    if (!data.learnings?.trim()) {
      errors.learnings = "Learnings are required";
    }
    if (!data.challenges?.trim()) {
      errors.challenges = "Challenges are required";
    }
    if (!data.improvements?.trim()) {
      errors.improvements = "Improvements are required";
    }
    if (!data.acknowledgments?.trim()) {
      errors.acknowledgments = "Acknowledgments are required";
    }
  }

  return errors;
}; 