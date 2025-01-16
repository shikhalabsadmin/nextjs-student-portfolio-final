export const SUBJECTS = [
  "Mathematics",
  "Science",
  "English",
  "History",
  "Art",
  "Music",
  "Physical Education",
  "Other"
];

export const ARTIFACT_TYPES = [
  "Project",
  "Essay",
  "Model",
  "Performance",
  "Presentation",
  "Other"
];

export const SKILLS = [
  { id: "problem_solving", name: "Problem Solving" },
  { id: "creativity", name: "Creativity" },
  { id: "critical_thinking", name: "Critical Thinking" },
  { id: "communication", name: "Communication" },
  { id: "collaboration", name: "Collaboration" },
  { id: "technical_skills", name: "Technical Skills" }
];

export const ASSIGNMENT_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  VERIFIED: "verified",
  PUBLISHED: "published"
} as const;

export const STORAGE_KEY = "assignment_draft"; 