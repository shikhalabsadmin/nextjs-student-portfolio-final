import { type AssignmentStep, type StepConfig } from "@/types/assignment";
import { type AssignmentFormValues } from "@/lib/validations/assignment";
import { STEPS } from "@/lib/config/steps";
import { ASSIGNMENT_STATUS, type AssignmentStatus } from "@/constants/assignment-status";
import { logger } from "@/lib/logger";

// Constants and types
const RESTRICTED_STATUSES = [
  ASSIGNMENT_STATUS.SUBMITTED,
  ASSIGNMENT_STATUS.APPROVED,
] as const;

// Type definitions for step validation
interface StepRequirement {
  fields: (keyof AssignmentFormValues)[];
  customCheck?: (data: AssignmentFormValues) => boolean;
  dependsOnPrevious?: boolean;
  alwaysValid?: boolean;
}

// Helper functions
const isRestrictedStatus = (status: AssignmentStatus): boolean => {
  return RESTRICTED_STATUSES.includes(status as (typeof RESTRICTED_STATUSES)[number]);
};

// Add at the top of the file after imports
const DEBUG = true;
function debugLog(...args: any[]) {
  if (DEBUG) {
    console.log("[StepService Debug]", ...args);
  }
}

// Logger instance
const stepLogger = logger.forModule("StepService");

/**
 * Validation requirements for each step in the assignment form
 */
const STEP_REQUIREMENTS: Record<AssignmentStep, StepRequirement> = {
  'basic-info': {
    fields: ['title', 'artifact_type', 'subject', 'month'],
    customCheck: (data: AssignmentFormValues) => {
      // At least one of files, youtubelinks, or externalLinks is required
      const hasYoutubeLinks = Array.isArray(data.youtubelinks) && 
        data.youtubelinks.some(link => link?.url && link.url.trim().length > 0);
      const hasExternalLinks = Array.isArray(data.externalLinks) && 
        data.externalLinks.some(link => link?.url && link.url.trim().length > 0);
      
      // Files are stored in assignment_files table, not tracked in form data
      // For assignments with an ID, assume files may exist since file upload works
      // but isn't properly integrated with form validation
      const hasFiles = Boolean(data.id); // If assignment exists, files may be uploaded
      
      // Return true if at least one type of artifact is present OR assignment has ID
      return hasYoutubeLinks || hasExternalLinks || hasFiles;
    }
  },
  'role-originality': {
    fields: ['is_team_work', 'is_original_work'],
    customCheck: (data: AssignmentFormValues) => {
      // If team work is selected, require team contribution details
      const teamWorkValid = data.is_team_work ? Boolean(data.team_contribution?.trim()) : true;
      // If original work is selected, require explanation
      const originalityValid = data.is_original_work ? Boolean(data.originality_explanation?.trim()) : true;
      return teamWorkValid && originalityValid;
    }
  },
  'skills-reflection': {
    fields: ['selected_skills', 'skills_justification', 'pride_reason']
  },
  'process-challenges': {
    fields: ['creation_process', 'learnings', 'challenges', 'improvements', 'acknowledgments']
  },
  'review-submit': {
    fields: [],
    // This step is valid only if all previous steps are valid
    dependsOnPrevious: true
  },
  'assignment-preview': {
    fields: [],
    // Preview is always valid for submitted assignments
    alwaysValid: true
  },
  'teacher-feedback': {
    fields: [],
    // Teacher feedback is always valid as it's completed by the teacher
    alwaysValid: true
  }
};

/**
 * Service for managing multi-step form navigation and validation
 * Handles step validation, navigation between steps, and identifying form errors
 */
export class StepService {
  private readonly steps: ReadonlyArray<StepConfig>;
  
  /**
   * Create a new StepService instance
   * @param steps Configuration for form steps
   */
  constructor(steps: ReadonlyArray<StepConfig> = STEPS) {
    this.steps = steps;
    stepLogger.info("StepService initialized with steps:", this.steps.map(s => s.id));
  }

  /**
   * Get all step IDs in the form
   * @returns Array of step IDs
   */
  getStepIds(): AssignmentStep[] {
    return this.steps.map(s => s.id);
  }
  
  /**
   * Find a step by its ID
   * @param stepId Step identifier
   * @returns Step configuration or undefined if not found
   */
  getStepById(stepId: AssignmentStep): StepConfig | undefined {
    return this.steps.find(s => s.id === stepId);
  }
  
  /**
   * Get the index of a step in the sequence
   * @param stepId Step identifier
   * @returns Zero-based index or -1 if not found
   */
  getStepIndex(stepId: AssignmentStep): number {
    return this.steps.findIndex(s => s.id === stepId);
  }
  
  /**
   * Check if assignment status allows editing
   * @param status Current assignment status
   * @returns Boolean indicating if editing is allowed
   */
  isEditable(status: AssignmentStatus): boolean {
    return !isRestrictedStatus(status);
  }
  
  /**
   * Check if a step is valid based on its requirements
   * @param stepId Step identifier
   * @param formData Current form data
   * @returns Boolean indicating if step is valid
   */
  validateStep(stepId: AssignmentStep, formData: AssignmentFormValues): boolean {
    // Validate step ID
    if (!this.isValidStep(stepId)) {
      stepLogger.error(`Unknown step ID: ${stepId}`);
      debugLog("VALIDATION ERROR: Invalid step ID", stepId);
      return false;
    }
    
    debugLog(`VALIDATION: Starting validation for step ${stepId}`, {
      stepId,
      status: formData.status,
      hasId: !!formData.id
    });
    
    // Special case for review-submit - only valid when status is SUBMITTED or APPROVED
    // NOT for NEEDS_REVISION because student needs to submit again
    if (stepId === 'review-submit') {
      const isActuallySubmitted = formData.status === ASSIGNMENT_STATUS.SUBMITTED || 
        formData.status === ASSIGNMENT_STATUS.APPROVED;
      debugLog("VALIDATION: Review step validation", { isActuallySubmitted, status: formData.status });
      return isActuallySubmitted;
    }

    // Special case for assignment-preview - only valid when status is SUBMITTED or later
    if (stepId === 'assignment-preview') {
      const isSubmittedOrLater = formData.status === ASSIGNMENT_STATUS.SUBMITTED || 
        formData.status === ASSIGNMENT_STATUS.APPROVED || 
        formData.status === ASSIGNMENT_STATUS.NEEDS_REVISION;
      debugLog("VALIDATION: Assignment preview step validation", { isSubmittedOrLater, status: formData.status });
      return isSubmittedOrLater;
    }

    // Special case for teacher-feedback - available when status is SUBMITTED or later, 
    // complete only when there's actual feedback data
    if (stepId === 'teacher-feedback') {
      const hasTeacherFeedbackStep = formData.status === ASSIGNMENT_STATUS.SUBMITTED ||
        formData.status === ASSIGNMENT_STATUS.APPROVED || 
        formData.status === ASSIGNMENT_STATUS.NEEDS_REVISION;
      
      if (!hasTeacherFeedbackStep) {
        debugLog("VALIDATION: Teacher feedback step validation failed - wrong status", { hasTeacherFeedbackStep, status: formData.status });
        return false;
      }
      
      // For submitted assignments, completion depends on whether there's feedback data
      const hasFeedbackData = formData.feedback && Array.isArray(formData.feedback) && formData.feedback.length > 0;
      debugLog("VALIDATION: Teacher feedback step validation", { 
        hasTeacherFeedbackStep, 
        hasFeedbackData, 
        status: formData.status,
        feedbackLength: formData.feedback?.length || 0
      });
      
      // Return completion status based on feedback data (false = circle, true = checkmark)
      return hasFeedbackData;
    }
    
    // For submitted, approved, or needs revision assignments, 
    // all other steps should be considered complete (not teacher-feedback or assignment-preview)
    const isSubmittedStatus = formData.status === ASSIGNMENT_STATUS.SUBMITTED || 
      formData.status === ASSIGNMENT_STATUS.APPROVED || 
      formData.status === ASSIGNMENT_STATUS.NEEDS_REVISION;
      
    if (isSubmittedStatus) {
      // At this point, we know stepId is not 'teacher-feedback' or 'assignment-preview' due to the conditions above
      debugLog(`VALIDATION: Step ${stepId} marked as complete due to submission status`, { status: formData.status });
      return true;
    }
    
    const requirements = STEP_REQUIREMENTS[stepId];
    debugLog("VALIDATION: Step requirements", { stepId, requirements });
    
    // Skip validation for steps marked as always valid
    if (requirements.alwaysValid) {
      debugLog(`VALIDATION: Step ${stepId} is always valid`);
      return true;
    }
    
    // Handle steps that depend on previous steps
    if (requirements.dependsOnPrevious) {
      const result = this.validatePreviousSteps(stepId, formData);
      debugLog(`VALIDATION: Step ${stepId} depends on previous steps. Result: ${result}`);
      return result;
    }
    
    // Validate required fields
    const fieldsValid = this.validateFields(requirements.fields, formData);
    debugLog("VALIDATION: Required fields validation", { stepId, fieldsValid, fields: requirements.fields });
    
    // Run custom validation if provided
    const customValid = requirements.customCheck ? requirements.customCheck(formData) : true;
    debugLog("VALIDATION: Custom validation", { stepId, customValid, hasCustomCheck: !!requirements.customCheck });
    
    // Enhanced logging for role-originality step specifically
    if (stepId === 'role-originality') {
      debugLog("VALIDATION: Role-originality specific check", {
        is_team_work: formData.is_team_work,
        is_original_work: formData.is_original_work,
        team_contribution: formData.team_contribution,
        originality_explanation: formData.originality_explanation,
        teamWorkValid: formData.is_team_work ? Boolean(formData.team_contribution?.trim()) : true,
        originalityValid: formData.is_original_work ? Boolean(formData.originality_explanation?.trim()) : true,
      });
    }
    
    const isValid = fieldsValid && customValid;
    stepLogger.debug(`Step ${stepId} validation result: ${isValid}`);
    debugLog(`VALIDATION: Step ${stepId} final validation result: ${isValid}`, {
      fieldsValid,
      customValid,
      overall: isValid
    });
    
    return isValid;
  }
  
  /**
   * Validate all previous steps before the given step
   * @param stepId Current step ID
   * @param formData Form data
   * @returns Boolean indicating if all previous steps are valid
   */
  private validatePreviousSteps(stepId: AssignmentStep, formData: AssignmentFormValues): boolean {
    const currentIndex = this.getStepIndex(stepId);
    
    for (let i = 0; i < currentIndex; i++) {
      const prevStepId = this.steps[i].id;
      if (!this.validateStep(prevStepId, formData)) {
        stepLogger.debug(`Step ${stepId} is invalid because previous step ${prevStepId} is invalid`);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Validate required fields in form data
   * @param fields Array of required field names
   * @param formData Form data
   * @returns Boolean indicating if all required fields are valid
   */
  private validateFields(fields: (keyof AssignmentFormValues)[], formData: AssignmentFormValues): boolean {
    const results = fields.map(field => {
      const value = formData[field];
      let isValid = false;
      
      if (Array.isArray(value)) {
        isValid = value.length > 0;
        debugLog(`Field validation (array)`, { field, value, isValid });
      } else if (typeof value === 'boolean') {
        isValid = value !== undefined && value !== null;
        debugLog(`Field validation (boolean)`, { field, value, isValid });
      } else if (typeof value === 'string' && value.includes('<')) {
        // Handle HTML content from rich text editors
        const textContent = value.replace(/<[^>]*>/g, '').trim();
        isValid = textContent !== '';
        debugLog(`Field validation (rich text)`, { field, textContent, isValid });
      } else {
        isValid = value != null && value !== '';
        debugLog(`Field validation (string)`, { field, value, isValid });
      }
      
      return { field, isValid };
    });
    
    const allValid = results.every(r => r.isValid);
    
    if (!allValid) {
      const invalidFields = results.filter(r => !r.isValid).map(r => r.field);
      debugLog("Invalid fields found:", invalidFields);
    }
    
    return allValid;
  }
  
  /**
   * Get the next step in the sequence
   * @param currentStep Current step ID
   * @param formData Form data (used for conditional navigation)
   * @returns Next step ID or null if at the end
   */
  getNextStep(currentStep: AssignmentStep, formData: AssignmentFormValues): AssignmentStep | null {
    const currentIndex = this.getStepIndex(currentStep);
    
    debugLog("NEXT STEP: Calculation starting", {
      currentStep,
      currentIndex,
      totalSteps: this.steps.length,
      status: formData.status
    });
    
    // Check if we're at the end or have an invalid step
    if (currentIndex === -1) {
      debugLog("NEXT STEP: Invalid current step", { currentStep });
      return null;
    }
    
    if (currentIndex === this.steps.length - 1) {
      debugLog("NEXT STEP: Already at final step", { currentStep });
      return null;
    }
    
    const nextStep = this.steps[currentIndex + 1].id;
    
    // Validate that we can actually move to the next step
    const currentStepValid = this.validateStep(currentStep, formData);
    debugLog("NEXT STEP: Current step validation", {
      currentStep,
      isValid: currentStepValid,
      nextStep
    });
    
    if (!currentStepValid) {
      debugLog("NEXT STEP: Cannot advance - current step invalid", { currentStep });
      return null;
    }
    
    stepLogger.debug(`Next step after ${currentStep} is ${nextStep}`);
    debugLog("NEXT STEP: Result", { from: currentStep, to: nextStep });
    return nextStep;
  }
  
  /**
   * Get the previous step in the sequence
   * @param currentStep Current step ID
   * @param formData Form data (used for conditional navigation)
   * @returns Previous step ID or null if at the beginning
   */
  getPreviousStep(currentStep: AssignmentStep, formData: AssignmentFormValues): AssignmentStep | null {
    const currentIndex = this.getStepIndex(currentStep);
    
    // Check if we're at the beginning
    if (currentIndex <= 0) {
      return null;
    }
    
    const prevStep = this.steps[currentIndex - 1].id;
    stepLogger.debug(`Previous step before ${currentStep} is ${prevStep}`);
    return prevStep;
  }
  
  /**
   * Find the next incomplete step in the form
   * Useful for guiding users to sections that need attention
   * @param formData Current form data
   * @returns Step ID of the first incomplete step, or review step if all complete
   */
  getNextIncompleteStep(formData: AssignmentFormValues): AssignmentStep {
    // If status is not editable, go to feedback
    if (!this.isEditable(formData.status)) {
      return 'teacher-feedback';
    }
    
    // Find the first incomplete step
    for (const step of this.steps) {
      const stepId = step.id;
      
      // Skip teacher feedback as it's completed by someone else
      if (stepId === 'teacher-feedback') continue;
      
      if (!this.validateStep(stepId, formData)) {
        stepLogger.debug(`Found incomplete step: ${stepId}`);
        return stepId;
      }
    }
    
    // If all steps are complete, go to review
    return 'review-submit';
  }
  
  /**
   * Validate all steps up to and including the target step
   * @param targetStep Target step ID
   * @param formData Form data
   * @returns Boolean indicating if all steps up to target are valid
   */
  validateUpToStep(targetStep: AssignmentStep, formData: AssignmentFormValues): boolean {
    const targetIndex = this.getStepIndex(targetStep);
    if (targetIndex === -1) return false;
    
    for (let i = 0; i <= targetIndex; i++) {
      if (!this.validateStep(this.steps[i].id, formData)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Find which step contains specific error fields
   * @param errors Form validation errors object
   * @returns Step ID containing errors, or null if none found
   */
  findStepWithErrors(errors: Record<string, unknown>): AssignmentStep | null {
    if (!errors || Object.keys(errors).length === 0) {
      return null;
    }
    
    const errorFields = Object.keys(errors);
    stepLogger.debug(`Finding step with error fields: ${errorFields.join(', ')}`);
    
    // Check each step to find which one contains the errors
    for (const step of this.steps) {
      const stepId = step.id;
      
      // Skip special steps that don't have direct field requirements
      if (stepId === 'review-submit' || stepId === 'teacher-feedback') {
        continue;
      }
      
      if (this.stepContainsErrorFields(stepId, errorFields)) {
        stepLogger.debug(`Found errors in step: ${stepId}`);
        return stepId;
      }
    }
    
    stepLogger.warn(`Could not determine specific step for errors: ${errorFields.join(', ')}`);
    return 'basic-info'; // Default to first step if we can't determine
  }
  
  /**
   * Check if a step contains any of the error fields
   * @param stepId Step ID to check
   * @param errorFields Array of field names with errors
   * @returns Boolean indicating if step contains any error fields
   */
  private stepContainsErrorFields(stepId: AssignmentStep, errorFields: string[]): boolean {
    const requirements = STEP_REQUIREMENTS[stepId];
    
    return errorFields.some(field => 
      // Check if field is in step's required fields
      requirements.fields.includes(field as keyof AssignmentFormValues) ||
      // Special handling for conditional fields
      (stepId === 'role-originality' && 
       (field === 'team_contribution' || field === 'originality_explanation'))
    );
  }
  
  /**
   * Check if a step ID is valid
   * @param stepId Step ID to check
   * @returns Type predicate indicating if ID is valid
   */
  private isValidStep(stepId: string): stepId is AssignmentStep {
    return this.steps.some(s => s.id === stepId);
  }
}