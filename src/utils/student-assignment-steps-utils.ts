import { type StepConfig } from "@/types/assignment";
import { AssignmentStatus } from "@/types/assignment-status";

/**
 * Filters steps based on assignment status
 * @param steps - Array of step configurations
 * @param status - Current assignment status
 * @returns Filtered array of steps
 */
export function getFilteredSteps(steps: StepConfig[], status: AssignmentStatus): StepConfig[] {
  if (status === AssignmentStatus.SUBMITTED || status === AssignmentStatus.VERIFIED) {
    return steps.filter(step => step.id === 'teacher-feedback');
  }
  return steps;
}