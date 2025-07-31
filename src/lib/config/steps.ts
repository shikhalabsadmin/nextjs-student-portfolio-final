import type { StepConfig } from "@/types/assignment";

export const STEPS: StepConfig[] = [
  {
    id: "basic-info",
    title: "Basic Information",
    header: "Basic Information",
    description: "Enter the artifact name, type, subject, and date."
  },
  {
    id: "role-originality",
    title: "Your Role & Originality",
    header: "Your Role & Originality",
    description: "Tell us about your role and what makes this work original."
  },
  {
    id: "skills-reflection",
    title: "Skills & Reflection",
    header: "Skills & Reflection",
    description: "Choose key skills you used and explain why they matter."
  },
  {
    id: "process-challenges",
    title: "Process & Challenges",
    header: "Process & Challenges",
    description: "Share your creation process and any challenges you faced."
  },
  {
    id: "review-submit",
    title: "Review & Submit",
    header: "Review Your Work Before Submitting",
    description: "Once submitted, your teacher will review it and provide feedback. You won't be able to edit after submission unless revisions are requested."
  },
  {
    id: "assignment-preview",
    title: "Submitted Assignment",
    header: "Your Submitted Assignment",
    description: "Here's your submitted assignment. Your teacher will review it and provide feedback."
  },
  {
    id: "teacher-feedback",
    title: "Teacher Feedback",
    header: "Feedback",
    description: "Your teacher will review your artifact and provide feedback here."
  }
]; 