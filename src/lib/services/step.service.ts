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

/**
 * Type for validation result cache entries
 */
interface ValidationCacheEntry {
  formDataHash: string;
  isValid: boolean;
  timestamp: number;
}

/**
 * Service for managing form steps validation and navigation
 */
export class StepService {
  private readonly stepValidations: Map<AssignmentStep, StepValidation>;
  private readonly visitedSteps: Set<AssignmentStep> = new Set();
  private readonly steps: ReadonlyArray<StepConfig>;
  
  // Cache to store validation results and prevent redundant calculations
  private readonly validationCache: Map<AssignmentStep, ValidationCacheEntry> = new Map();
  
  // Track steps currently being validated to prevent infinite loops
  private readonly validationInProgress: Set<AssignmentStep> = new Set();
  
  // Cache timeout in milliseconds (5 minutes)
  private readonly CACHE_TIMEOUT = 5 * 60 * 1000;

  constructor(steps: ReadonlyArray<StepConfig> = STEPS) {
    this.steps = steps;
    // Initialize validation configuration for each step
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

  /**
   * Mark a step as visited by the user
   */
  markStepVisited(stepId: AssignmentStep): void {
    if (!this.isValidStepId(stepId)) {
      debug.warn(`Attempted to mark invalid step as visited: ${stepId}`);
      return;
    }
    this.visitedSteps.add(stepId);
    debug.log(`Step ${stepId} marked as visited`);
  }

  /**
   * Check if a step has been visited
   */
  isStepVisited(stepId: AssignmentStep): boolean {
    if (!this.isValidStepId(stepId)) {
      debug.warn(`Checked visitation for invalid step: ${stepId}`);
      return false;
    }
    return this.visitedSteps.has(stepId);
  }

  /**
   * Validate a step's completion status with caching for performance
   * @param stepId The step to validate
   * @param formData The current form data
   * @param forceRevalidate Whether to bypass cache
   * @param skipPreviousStepsValidation Whether to skip validation of previous steps
   */
  validateStep(
    stepId: AssignmentStep, 
    formData: AssignmentFormValues, 
    forceRevalidate = false,
    skipPreviousStepsValidation = false
  ): boolean {
    // Input validation
    const step = this.stepValidations.get(stepId);
    if (!step) {
      debug.error(`Step ${stepId} not found in validation map`);
      return false;
    }

    // Anti-recursion protection
    if (this.validationInProgress.has(stepId)) {
      debug.warn(`Preventing recursive validation of step ${stepId}`);
      return this.stepValidations.get(stepId)?.isComplete ?? false;
    }

    // Check cache for validation result if not forcing revalidation
    if (!forceRevalidate) {
      const cachedResult = this.checkValidationCache(stepId, formData);
      if (cachedResult !== null) {
        return cachedResult;
      }
    }

    // Mark validation as in progress for this step to prevent recursion
    this.validationInProgress.add(stepId);

    try {
      // When validating just the current tab, skip previous steps validation if requested
      let previousStepsValid = true;
      if (!skipPreviousStepsValidation && stepId !== 'teacher-feedback') {
        const currentStepIndex = this.getStepIndex(stepId);
        previousStepsValid = this.validatePreviousSteps(currentStepIndex, formData);
      }

      // If previous steps are not valid and we care about previous steps, current step can't be valid
      if (!previousStepsValid && !skipPreviousStepsValidation) {
        const updatedStep = { ...step, isComplete: false };
        this.stepValidations.set(stepId, updatedStep);
        this.cacheValidationResult(stepId, formData, false);
        return false;
      }

      // Validate only this step's required fields and custom validators
      const requiredFieldsValid = this.validateRequiredFields(step.requiredFields, formData);
      const customValid = step.validator ? step.validator(formData) : true;
      const isValid = requiredFieldsValid && customValid;

      // Update step completion status with immutability
      const updatedStep = { ...step, isComplete: isValid };
      this.stepValidations.set(stepId, updatedStep);

      // Cache the validation result
      this.cacheValidationResult(stepId, formData, isValid);

      debug.log(`Step ${stepId} validation`, { isComplete: isValid });
      return isValid;
    } finally {
      // Always remove the in-progress marker when done
      this.validationInProgress.delete(stepId);
    }
  }

  /**
   * Validate only the current step's fields, ignoring previous steps
   * Useful for form validation focused only on current tab
   */
  validateCurrentStepOnly(stepId: AssignmentStep, formData: AssignmentFormValues): boolean {
    return this.validateStep(stepId, formData, true, true);
  }

  /**
   * Check if navigation to a target step is allowed
   */
  canNavigateToStep(targetStep: AssignmentStep, currentStep: AssignmentStep, formData: AssignmentFormValues): boolean {
    if (!this.isValidStepId(targetStep) || !this.isValidStepId(currentStep)) {
      debug.warn(`Invalid navigation attempt from ${currentStep} to ${targetStep}`);
      return false;
    }

    // Special case: If trying to navigate to the current step, allow it
    if (targetStep === currentStep) {
      return true;
    }

    const status = this.getAssignmentStatus(formData);
    
    // Restricted status handling (submitted/approved assignments)
    if (RESTRICTED_STATUSES.includes(status as RestrictedStatus)) {
      return targetStep === 'teacher-feedback'; // Only teacher-feedback is accessible
    }

    const targetIndex = this.getStepIndex(targetStep);
    const currentIndex = this.getStepIndex(currentStep);
    
    // Can always go back to a previous step
    if (targetIndex < currentIndex) {
      return true;
    }
    
    // To move forward, check if all preceding steps are valid
    return this.validateStepsRange(0, targetIndex, formData);
  }

  /**
   * Get the next step if current step is complete
   */
  getNext(currentStep: AssignmentStep, formData: AssignmentFormValues): AssignmentStep | null {
    if (!this.isValidStepId(currentStep)) {
      debug.warn(`Attempted to get next step from invalid step: ${currentStep}`);
      return null;
    }

    const status = this.getAssignmentStatus(formData);
    
    if (RESTRICTED_STATUSES.includes(status as RestrictedStatus)) {
      return 'teacher-feedback';
    }

    const currentIndex = this.getStepIndex(currentStep);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex >= this.steps.length) {
      return null; // No next step available
    }

    // Check if current step is complete
    if (!this.validateStep(currentStep, formData)) {
      return null; // Can't proceed if current step isn't complete
    }

    return this.steps[nextIndex].id;
  }

  /**
   * Get the previous step if navigation is allowed
   */
  getPrevious(currentStep: AssignmentStep, formData: AssignmentFormValues): AssignmentStep | null {
    if (!this.isValidStepId(currentStep)) {
      debug.warn(`Attempted to get previous step from invalid step: ${currentStep}`);
      return null;
    }

    const currentIndex = this.getStepIndex(currentStep);
    if (currentIndex <= 0) {
      return null; // No previous step available
    }

    // For restricted statuses, don't allow navigation away from teacher-feedback
    const status = this.getAssignmentStatus(formData);
    if (RESTRICTED_STATUSES.includes(status as RestrictedStatus)) {
      return null;
    }

    const prevIndex = currentIndex - 1;
    return this.steps[prevIndex].id;
  }

  /**
   * Check if a step is complete
   */
  isStepComplete(stepId: AssignmentStep): boolean {
    if (!this.isValidStepId(stepId)) {
      debug.warn(`Checked completion for invalid step: ${stepId}`);
      return false;
    }
    return this.stepValidations.get(stepId)?.isComplete ?? false;
  }

  /**
   * Check if a step can be edited based on assignment status
   */
  isStepEditable(stepId: AssignmentStep, formData: AssignmentFormValues): boolean {
    if (!this.isValidStepId(stepId)) {
      debug.warn(`Checked editability for invalid step: ${stepId}`);
      return false;
    }
    
    const status = this.getAssignmentStatus(formData);
    // Either the status allows editing, or it's the teacher-feedback step
    return !RESTRICTED_STATUSES.includes(status as RestrictedStatus) || stepId === 'teacher-feedback';
  }

  /**
   * Reset all validation state
   */
  resetStepValidation(): void {
    // Create new objects to maintain immutability
    this.stepValidations.forEach((step, key) => {
      this.stepValidations.set(key, { ...step, isComplete: false });
    });
    this.visitedSteps.clear();
    this.validationCache.clear();
    this.validationInProgress.clear();
    debug.log("Step validation reset");
  }

  /**
   * Invalidate cache for a specific step or all steps
   * @param stepId Optional specific step to invalidate, if not provided all steps are invalidated
   */
  invalidateCache(stepId?: AssignmentStep): void {
    if (stepId) {
      this.validationCache.delete(stepId);
      debug.log(`Cache invalidated for step: ${stepId}`);
    } else {
      this.validationCache.clear();
      debug.log("All validation caches cleared");
    }
  }

  /* =============== Private helper methods =============== */

  /**
   * Validate all required fields for a step
   */
  private validateRequiredFields(fields: (keyof AssignmentFormValues)[], formData: AssignmentFormValues): boolean {
    return fields.every(field => {
      const value = formData[field];
      
      // Different validation based on field type
      if (Array.isArray(value)) {
        return value.length > 0;
      } else if (typeof value === 'boolean') {
        // For boolean fields, they just need to be defined
        // Note: If specific boolean value is required, use a custom validator
        return value !== undefined && value !== null;
      } else {
        return value != null && value !== '';
      }
    });
  }

  /**
   * Check if assignment has artifact content
   */
  private hasArtifacts(formData: AssignmentFormValues): boolean {
    // Check for valid YouTube links
    const hasYoutubeLinks = Array.isArray(formData.youtubelinks) && 
                           formData.youtubelinks.some(link => link?.url?.trim());
                           
    // Check for artifact URL
    const hasArtifactUrl = Boolean(formData.artifact_url?.trim());
    
    // Check for file uploads if applicable
    const hasFiles = Array.isArray(formData.files) && formData.files.length > 0;
    
    return hasYoutubeLinks || hasArtifactUrl || hasFiles;
  }

  /**
   * Validate team contribution for team work
   */
  private validateRoleOriginality(formData: AssignmentFormValues): boolean {
    // Team work requires team contribution
    return !formData.is_team_work || Boolean(formData.team_contribution?.trim());
  }

  /**
   * Check if feedback exists
   */
  private hasFeedback(formData: AssignmentFormValues): boolean {
    return Boolean(
      formData.feedback && 
      typeof formData.feedback === 'object' &&
      formData.feedback !== null &&
      Object.keys(formData.feedback).length > 0
    );
  }

  /**
   * Check validation cache for a step + formData combination
   * @returns The cached validation result or null if not cached
   */
  private checkValidationCache(stepId: AssignmentStep, formData: AssignmentFormValues): boolean | null {
    const cacheEntry = this.validationCache.get(stepId);
    if (!cacheEntry) return null;
    
    // Check if cache has expired
    const now = Date.now();
    if (now - cacheEntry.timestamp > this.CACHE_TIMEOUT) {
      this.validationCache.delete(stepId);
      return null;
    }
    
    // Check if the form data has changed
    const currentHash = this.hashFormData(formData, stepId);
    if (currentHash !== cacheEntry.formDataHash) {
      return null;
    }
    
    // Return cached validation result
    return cacheEntry.isValid;
  }

  /**
   * Store validation result in cache
   */
  private cacheValidationResult(stepId: AssignmentStep, formData: AssignmentFormValues, isValid: boolean): void {
    const formDataHash = this.hashFormData(formData, stepId);
    this.validationCache.set(stepId, {
      formDataHash,
      isValid,
      timestamp: Date.now()
    });
  }

  /**
   * Create a hash of form data for cache comparison
   * Only hashes the fields relevant to the specified step
   */
  private hashFormData(formData: AssignmentFormValues, stepId: AssignmentStep): string {
    const step = this.stepValidations.get(stepId);
    if (!step) return '';
    
    // Extract only the fields relevant to this step
    const relevantData: Record<string, unknown> = {};
    
    // Include all required fields
    step.requiredFields.forEach(field => {
      relevantData[field as string] = formData[field];
    });
    
    // Include any additional fields needed by custom validators
    if (stepId === 'basic-info') {
      // For artifact validation
      relevantData.youtubelinks = formData.youtubelinks;
      relevantData.artifact_url = formData.artifact_url;
      relevantData.files = formData.files;
    } else if (stepId === 'role-originality') {
      // For role validation
      relevantData.is_team_work = formData.is_team_work;
      relevantData.team_contribution = formData.team_contribution;
    } else if (stepId === 'teacher-feedback') {
      // For feedback validation
      relevantData.feedback = formData.feedback;
    }
    
    // Create a string hash
    return JSON.stringify(relevantData);
  }

  /**
   * Get index of a step in the steps array
   */
  private getStepIndex(stepId: AssignmentStep): number {
    const index = this.steps.findIndex(step => step.id === stepId);
    if (index === -1) {
      debug.warn(`Step not found: ${stepId}`);
    }
    return index;
  }

  /**
   * Check if step ID is valid
   */
  private isValidStepId(stepId: unknown): stepId is AssignmentStep {
    return typeof stepId === 'string' && this.stepValidations.has(stepId as AssignmentStep);
  }

  /**
   * Get current assignment status with fallback to DRAFT
   */
  private getAssignmentStatus(formData: AssignmentFormValues): AssignmentStatus {
    return (formData.status || ASSIGNMENT_STATUS.DRAFT) as AssignmentStatus;
  }

  /**
   * Validate all steps in a given range
   * This avoids recursive validation by iterating through the range once
   */
  private validateStepsRange(startIndex: number, endIndex: number, formData: AssignmentFormValues): boolean {
    for (let i = startIndex; i <= endIndex; i++) {
      const stepId = this.steps[i].id;
      const step = this.stepValidations.get(stepId);
      if (!step) continue;

      // Validate just this step's fields without recursively validating previous steps
      const fieldsValid = this.validateRequiredFields(step.requiredFields, formData);
      const customValid = step.validator ? step.validator(formData) : true;
      
      if (!fieldsValid || !customValid) {
        return false;
      }
    }
    return true;
  }

  /**
   * Validate all steps before the given index
   * Optimized to avoid recursive validation calls
   */
  private validatePreviousSteps(currentStepIndex: number, formData: AssignmentFormValues): boolean {
    return this.validateStepsRange(0, currentStepIndex - 1, formData);
  }
}