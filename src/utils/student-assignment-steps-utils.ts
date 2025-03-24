import { type StepConfig } from "@/types/assignment";
import { ASSIGNMENT_STATUS, AssignmentStatus } from "@/constants/assignment-status";

/**
 * Filters steps based on assignment status
 * @param steps - Array of step configurations
 * @param status - Current assignment status
 * @returns Filtered array of steps
 */
export function getFilteredSteps(steps: StepConfig[], status: AssignmentStatus): StepConfig[] {
  if (status === ASSIGNMENT_STATUS.SUBMITTED || status === ASSIGNMENT_STATUS.UNDER_REVIEW) {
    // First check if teacher-feedback step exists in the array
    const feedbackStep = steps.find(step => step.id === 'teacher-feedback');
    if (feedbackStep) {
      return [feedbackStep]; // Return only the feedback step
    }
    // If teacher-feedback step doesn't exist, return the original array
    return steps;
  }
  return steps;
}