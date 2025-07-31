/**
 * Comprehensive mapping from questionId to actual question text that students see
 * These are the exact FormLabel texts from the assignment form components
 * Used in teacher approval modals and student feedback displays
 */
export const QUESTION_LABELS: Record<string, string> = {
  // Basic Info Questions (from BasicInfoStep.tsx)
  title: "What is the name of your work?",
  artifact_type: "What type of work is this?",
  subject: "What subject is this for?",
  month: "Completion Date",
  files: "Files and Links Upload",
  
  // Collaboration Questions (from CollaborationStep.tsx)
  is_team_work: "Is this a team project",
  team_contribution: "Describe your role and experience",
  is_original_work: "Did you create something new or original?",
  originality_explanation: "Explain what was new",
  
  // Skills Questions (from SkillsSelection.tsx, SkillsJustification.tsx, PrideReason.tsx)
  selected_skills: "What skills did you practice? (Select Top 3)",
  skills_justification: "Justify the selected skills",
  pride_reason: "Why are you proud of this artifact?",
  
  // Reflection Questions (from reflection-sections/*.tsx)
  creation_process: "Describe the process you used to create it",
  learnings: "Your learnings and future applications",
  challenges: "Your challenges",
  improvements: "Your improvements",
  acknowledgments: "Your gratitude",
};

/**
 * Get the display label for a question ID
 * Falls back to a formatted version of the ID if no mapping exists
 */
export function getQuestionLabel(questionId: string): string {
  return QUESTION_LABELS[questionId] || questionId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
} 