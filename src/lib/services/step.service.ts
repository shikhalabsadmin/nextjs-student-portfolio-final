import { type AssignmentStep, type StepConfig } from "@/types/assignment";
import { type AssignmentFormValues } from "@/lib/validations/assignment";
import { STEPS } from "@/lib/config/steps";
import { debug } from "@/lib/utils/debug.service";
import { AssignmentStatus } from "@/types/assignment-status";

export interface StepValidation {
  id: AssignmentStep;
  requiredFields: (keyof AssignmentFormValues)[];
  isComplete: boolean;
}

/**
 * Enhanced StepService with better type safety and validation
 */
export class StepService {
  private stepValidations: StepValidation[];
  private visitedSteps: Set<AssignmentStep> = new Set();

  constructor(private steps = STEPS) {
    this.stepValidations = [
      { id: 'basic-info', requiredFields: ['title', 'artifact_type', 'month'], isComplete: false },
      { id: 'role-originality', requiredFields: ['is_team_work', 'is_original_work'], isComplete: false },
      { id: 'skills-reflection', requiredFields: ['selected_skills'], isComplete: false },
      { id: 'process-challenges', requiredFields: ['creation_process', 'challenges'], isComplete: false },
      { id: 'review-submit', requiredFields: [], isComplete: false },
      { id: 'teacher-feedback', requiredFields: [], isComplete: false },
    ];
    debug.info("StepService initialized with validations", this.stepValidations);
  }

  /**
   * Mark a step as visited
   */
  markStepVisited(stepId: AssignmentStep): void {
    this.visitedSteps.add(stepId);
    debug.log(`Step ${stepId} marked as visited`);
  }

  /**
   * Check if a step has been visited
   */
  isStepVisited(stepId: AssignmentStep): boolean {
    return this.visitedSteps.has(stepId);
  }

  /**
   * Validate a step with form data
   */
  validateStep(stepId: AssignmentStep, formData: AssignmentFormValues): boolean {
    if (!this.isStepVisited(stepId)) {
      this.markStepVisited(stepId); // Auto-mark as visited to fix potential initialization issues
    }

    const step = this.stepValidations.find(s => s.id === stepId);
    if (!step) {
      debug.error(`Step ${stepId} not found in validations`);
      return false;
    }

    // Special case for review-submit step - it's only valid if all previous steps are valid
    if (stepId === 'review-submit') {
      const previousSteps = this.stepValidations.filter(s => s.id !== 'review-submit' && s.id !== 'teacher-feedback');
      const allPreviousStepsValid = previousSteps.every(s => this.validateStep(s.id, formData));
      step.isComplete = allPreviousStepsValid;
      debug.log(`Review step validation result`, { isComplete: step.isComplete });
      return step.isComplete;
    }

    // Check required fields
    const requiredFieldsValid = step.requiredFields.every(field => {
      const value = formData[field];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'boolean') return true;
      return value !== null && value !== undefined && value !== '';
    });

    debug.log(`Required fields validation for ${stepId}`, { requiredFieldsValid });

    // Additional validation for role-originality step
    if (stepId === 'role-originality') {
      const teamWorkValid = !formData.is_team_work || 
                          (formData.team_contribution && formData.team_contribution.trim() !== "");
      
      const originalWorkValid = !formData.is_original_work || 
                              (formData.originality_explanation && formData.originality_explanation.trim() !== "");
      
      debug.log(`Additional validations for ${stepId}`, { 
        teamWorkValid, 
        originalWorkValid 
      });
      
      if (!teamWorkValid || !originalWorkValid) {
        step.isComplete = false;
        return false;
      }
    }

    // For basic-info step, also check if either files or youtubelinks are provided
    if (stepId === 'basic-info') {
      const hasFiles = Array.isArray(formData.files) && formData.files.length > 0;
      const hasYoutubeLinks = Array.isArray(formData.youtubelinks) && 
                             formData.youtubelinks.some(link => link.url && link.url.trim() !== '');
      
      const hasArtifacts = hasFiles || hasYoutubeLinks;
      debug.log(`Artifact validation for ${stepId}`, { hasFiles, hasYoutubeLinks, hasArtifacts });
      
      step.isComplete = requiredFieldsValid && hasArtifacts;
    } else {
      step.isComplete = requiredFieldsValid;
    }

    debug.log(`Step ${stepId} validation result`, { isComplete: step.isComplete });
    return step.isComplete;
  }

  /**
   * Check if navigation to a target step is allowed
   */
  canNavigateToStep(targetStep: AssignmentStep, currentStep: AssignmentStep, formData: AssignmentFormValues): boolean {
    const currentIndex = this.steps.findIndex(step => step.id === currentStep);
    const targetIndex = this.steps.findIndex(step => step.id === targetStep);

    if (targetIndex < 0 || currentIndex < 0) {
      debug.warn(`Invalid step navigation from ${currentStep} to ${targetStep}`);
      return false;
    }
    
    // Check assignment status
    const status = formData.status || AssignmentStatus.DRAFT;
    
    // If status is SUBMITTED or VERIFIED, only allow navigation to teacher-feedback
    if (status === AssignmentStatus.SUBMITTED || status === AssignmentStatus.VERIFIED) {
      debug.log(`Assignment is ${status}, restricting navigation`);
      return targetStep === 'teacher-feedback';
    }
    
    // Always allow going backward
    if (targetIndex < currentIndex) {
      debug.log(`Backward navigation from ${currentStep} to ${targetStep} allowed`);
      return true;
    }

    // For forward navigation, validate all previous steps
    const allPreviousStepsValid = this.steps.slice(0, currentIndex + 1).every(step => 
      this.validateStep(step.id, formData)
    );
    
    debug.log(`Forward navigation from ${currentStep} to ${targetStep}`, { allowed: allPreviousStepsValid });
    return allPreviousStepsValid;
  }

  /**
   * Get the next step if current step is valid
   */
  getNext(currentStep: AssignmentStep, formData: AssignmentFormValues): AssignmentStep | null {
    // Check assignment status
    const status = formData.status || AssignmentStatus.DRAFT;
    
    // If status is SUBMITTED or VERIFIED, only allow teacher-feedback as next
    if (status === AssignmentStatus.SUBMITTED || status === AssignmentStatus.VERIFIED) {
      debug.log(`Assignment is ${status}, next step is teacher-feedback`);
      return 'teacher-feedback';
    }
    
    if (!this.validateStep(currentStep, formData)) {
      debug.log(`Cannot proceed from ${currentStep}: validation failed`);
      return null;
    }

    const currentIndex = this.steps.findIndex(step => step.id === currentStep);
    const nextStep = currentIndex < this.steps.length - 1 ? this.steps[currentIndex + 1].id : null;
    
    debug.log(`Next step from ${currentStep}`, { nextStep });
    return nextStep;
  }

  /**
   * Get the previous step
   */
  getPrevious(currentStep: AssignmentStep): AssignmentStep | null {
    const currentIndex = this.steps.findIndex(step => step.id === currentStep);
    const prevStep = currentIndex > 0 ? this.steps[currentIndex - 1].id : null;
    
    debug.log(`Previous step from ${currentStep}`, { prevStep });
    return prevStep;
  }

  /**
   * Check if a step is complete based on cached validation results
   */
  isStepComplete(stepId: AssignmentStep): boolean {
    const isComplete = this.stepValidations.find(s => s.id === stepId)?.isComplete ?? false;
    debug.log(`Step ${stepId} completion check`, { isComplete });
    return isComplete;
  }

  /**
   * Reset all step validation state
   */
  resetStepValidation(): void {
    this.stepValidations.forEach(step => {
      step.isComplete = false;
    });
    this.visitedSteps.clear();
    debug.log("Step validation state has been reset");
  }
} 