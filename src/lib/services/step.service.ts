import { type AssignmentStep, type StepConfig } from "@/types/assignment";
import { type AssignmentFormValues } from "@/lib/validations/assignment";
import { STEPS } from "@/lib/config/steps";
import { debug } from "@/lib/utils/debug.service";
import { ASSIGNMENT_STATUS, type AssignmentStatus, type RestrictedStatus } from "@/constants/assignment-status";

const RESTRICTED_STATUSES: RestrictedStatus[] = [
  ASSIGNMENT_STATUS.SUBMITTED,
  ASSIGNMENT_STATUS.APPROVED,
];

interface StepValidation {
  id: AssignmentStep;
  requiredFields: (keyof AssignmentFormValues)[];
  isComplete: boolean;
  validator?: (formData: AssignmentFormValues) => boolean;
}

export class StepService {
  private readonly stepValidations: Map<AssignmentStep, StepValidation>;
  private readonly visitedSteps: Set<AssignmentStep> = new Set();
  private readonly steps: ReadonlyArray<StepConfig>;

  constructor(steps: ReadonlyArray<StepConfig> = STEPS) {
    this.steps = steps;
    this.stepValidations = new Map<AssignmentStep, StepValidation>([
      ['basic-info', { 
        id: 'basic-info', 
        requiredFields: ['title', 'artifact_type', 'subject', 'month'],
        isComplete: false,
        validator: this.hasArtifacts.bind(this),
      }],
      ['role-originality', { 
        id: 'role-originality', 
        requiredFields: ['is_team_work', 'is_original_work'],
        isComplete: false,
        validator: this.validateRoleOriginality.bind(this),
      }],
      ['skills-reflection', { 
        id: 'skills-reflection', 
        requiredFields: ['selected_skills', 'skills_justification', 'pride_reason'],
        isComplete: false,
      }],
      ['process-challenges', { 
        id: 'process-challenges', 
        requiredFields: ['creation_process', 'learnings', 'challenges', 'improvements', 'acknowledgments'],
        isComplete: false,
      }],
      ['review-submit', { 
        id: 'review-submit', 
        requiredFields: [],
        isComplete: false,
      }],
      ['teacher-feedback', { 
        id: 'teacher-feedback', 
        requiredFields: [],
        isComplete: false,
        validator: this.hasFeedback.bind(this),
      }],
    ]);
    debug.info("StepService initialized", Array.from(this.stepValidations.keys()));
  }

  markStepVisited(stepId: AssignmentStep): void {
    this.visitedSteps.add(stepId);
    debug.log(`Step ${stepId} marked as visited`);
  }

  isStepVisited(stepId: AssignmentStep): boolean {
    return this.visitedSteps.has(stepId);
  }

  validateStep(stepId: AssignmentStep, formData: AssignmentFormValues): boolean {
    const step = this.stepValidations.get(stepId);
    if (!step) {
      debug.error(`Step ${stepId} not found`);
      return false;
    }

    // First check if all previous steps are complete
    const currentStepIndex = this.getStepIndex(stepId);
    const allPreviousStepsComplete = this.steps
      .slice(0, currentStepIndex)
      .every(prevStep => {
        const validation = this.stepValidations.get(prevStep.id);
        if (!validation) return false;
        
        // Check required fields
        const requiredFieldsValid = this.validateRequiredFields(validation.requiredFields, formData);
        
        // Apply custom validator if it exists
        let customValid = true;
        if (validation.validator) {
          customValid = validation.validator(formData);
        }
        
        return requiredFieldsValid && customValid;
      });

    // Only validate current step if all previous steps are complete
    if (!allPreviousStepsComplete) {
      step.isComplete = false;
      return false;
    }

    const requiredFieldsValid = this.validateRequiredFields(step.requiredFields, formData);
    let customValid = true;
    if (step.validator) {
      customValid = step.validator(formData);
    }
    step.isComplete = requiredFieldsValid && customValid;

    debug.log(`Step ${stepId} validation`, { isComplete: step.isComplete });
    return step.isComplete;
  }

  canNavigateToStep(targetStep: AssignmentStep, currentStep: AssignmentStep, formData: AssignmentFormValues): boolean {
    const currentIndex = this.getStepIndex(currentStep);
    const targetIndex = this.getStepIndex(targetStep);

    if (currentIndex === -1 || targetIndex === -1) {
      debug.warn(`Invalid navigation from ${currentStep} to ${targetStep}`);
      return false;
    }

    const status: AssignmentStatus = formData.status || ASSIGNMENT_STATUS.DRAFT;
    if (RESTRICTED_STATUSES.includes(status as RestrictedStatus)) {
      return targetStep === 'teacher-feedback'; // Lock to teacher-feedback for restricted statuses
    }

    // Check if all steps before the target step are complete
    const allPreviousStepsComplete = this.steps
      .slice(0, targetIndex)
      .every(step => this.validateStep(step.id, formData));

    if (!allPreviousStepsComplete) {
      debug.warn(`Navigation to ${targetStep} blocked: previous steps incomplete`);
      return false;
    }

    return true;
  }

  getNext(currentStep: AssignmentStep, formData: AssignmentFormValues): AssignmentStep | null {
    const status: AssignmentStatus = formData.status || ASSIGNMENT_STATUS.DRAFT;
    if (RESTRICTED_STATUSES.includes(status as RestrictedStatus)) {
      return 'teacher-feedback';
    }

    const currentIndex = this.getStepIndex(currentStep);
    const nextIndex = currentIndex + 1;
    if (nextIndex >= this.steps.length) return null;

    // Check if all steps up to the current one are complete
    const allPreviousStepsComplete = this.steps
      .slice(0, currentIndex + 1) // Include current step
      .every(step => this.validateStep(step.id, formData));

    return allPreviousStepsComplete ? this.steps[nextIndex].id : null;
  }

  getPrevious(currentStep: AssignmentStep, formData: AssignmentFormValues): AssignmentStep | null {
    const currentIndex = this.getStepIndex(currentStep);
    if (currentIndex <= 0) return null;

    const prevIndex = currentIndex - 1;
    const prevStep = this.steps[prevIndex].id;

    // Check if all steps before the previous step are complete
    const allPreviousStepsComplete = this.steps
      .slice(0, prevIndex)
      .every(step => this.validateStep(step.id, formData));

    return allPreviousStepsComplete ? prevStep : null;
  }

  isStepComplete(stepId: AssignmentStep): boolean {
    return this.stepValidations.get(stepId)?.isComplete ?? false;
  }

  isStepEditable(stepId: AssignmentStep, formData: AssignmentFormValues): boolean {
    const status: AssignmentStatus = formData.status || ASSIGNMENT_STATUS.DRAFT;
    return !RESTRICTED_STATUSES.includes(status as RestrictedStatus) || stepId === 'teacher-feedback';
  }

  resetStepValidation(): void {
    this.stepValidations.forEach(step => (step.isComplete = false));
    this.visitedSteps.clear();
    debug.log("Step validation reset");
  }

  private validateRequiredFields(fields: (keyof AssignmentFormValues)[], formData: AssignmentFormValues): boolean {
    return fields.every(field => {
      const value = formData[field];
      return Array.isArray(value) ? value.length > 0 : 
             typeof value === 'boolean' ? true : 
             value != null && value !== '';
    });
  }

  private hasArtifacts(formData: AssignmentFormValues): boolean {
    const hasFiles = Array.isArray(formData.files) && formData.files.length > 0;
    const hasYoutubeLinks = Array.isArray(formData.youtubelinks) && 
                           formData.youtubelinks.some(link => link.url?.trim());
    return hasFiles || hasYoutubeLinks;
  }

  private validateRoleOriginality(formData: AssignmentFormValues): boolean {
    const teamWorkValid = !formData.is_team_work || !!formData.team_contribution?.trim();
    const originalWorkValid = !formData.is_original_work || !!formData.originality_explanation?.trim();
    return teamWorkValid && originalWorkValid;
  }

  private hasFeedback(formData: AssignmentFormValues): boolean {
    return !!formData.feedback && typeof formData.feedback === 'object' && Object.keys(formData.feedback).length > 0;
  }

  private getStepIndex(stepId: AssignmentStep): number {
    return this.steps.findIndex(step => step.id === stepId);
  }
}