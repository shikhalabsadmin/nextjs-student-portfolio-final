import { type StepConfig } from "@/types/assignment";
import { ASSIGNMENT_STATUS, AssignmentStatus } from "@/constants/assignment-status";

/**
 * Filters steps based on assignment status and actual completion state
 * @param steps - Array of step configurations
 * @param status - Current assignment status
 * @param isActuallyComplete - Whether all required steps are actually complete
 * @returns Filtered array of steps
 */
export function getFilteredSteps(steps: StepConfig[], status: AssignmentStatus, isActuallyComplete: boolean = false): StepConfig[] {

  // ✅ CLEAN LOGIC: Only show post-submission steps when assignment is truly submitted AND complete
  
  if (status === ASSIGNMENT_STATUS.NEEDS_REVISION) {
    // Show all work steps AND teacher feedback for revision requests
    // Students need to see feedback AND be able to edit their work
    const filteredSteps = steps.filter(step => step.id !== 'assignment-preview');
    return filteredSteps;
  }
  
  if ((status === ASSIGNMENT_STATUS.SUBMITTED || status === ASSIGNMENT_STATUS.APPROVED) && isActuallyComplete) {
    // Only show ALL steps (including assignment-preview & teacher-feedback) when truly submitted AND complete
    return steps;
  }
  
  // ✅ DEFAULT: For all other cases (draft, incomplete "submitted", etc.), show only work steps
  // Never show assignment-preview or teacher-feedback until assignment is actually submitted and complete
  const workSteps = steps.filter(step => 
    step.id !== 'teacher-feedback' && 
    step.id !== 'assignment-preview'
  );
  return workSteps;
}