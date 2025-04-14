import { type AssignmentStep, type StepConfig } from "@/types/assignment";
import { type AssignmentFormValues } from "@/lib/validations/assignment";
import { STEPS } from "@/lib/config/steps";
import { debug } from "@/lib/utils/debug.service";
import { ASSIGNMENT_STATUS, type AssignmentStatus } from "@/constants/assignment-status";

// Restricted statuses limiting editing only
const RESTRICTED_STATUSES = [
  ASSIGNMENT_STATUS.SUBMITTED,
  ASSIGNMENT_STATUS.APPROVED,
] as const;

// Type alias for restricted status values
type RestrictedStatus = typeof RESTRICTED_STATUSES[number];

// Type guard function to check if a status is restricted for editing
function isRestrictedStatus(status: AssignmentStatus): status is RestrictedStatus {
  return RESTRICTED_STATUSES.includes(status as RestrictedStatus);
}

// Step validation rules with required fields and custom logic
const STEP_VALIDATION_CONFIG: Record<AssignmentStep, {
  requiredFields: (keyof AssignmentFormValues)[];
  validate?: (formData: AssignmentFormValues, service: StepService) => boolean;
}> = {
  'basic-info': {
    requiredFields: ['title', 'artifact_type', 'subject', 'month'],
    validate: (formData) => {
      const hasYoutubeLinks = Boolean(formData.youtubelinks?.length);
      const hasFiles = Boolean(formData.files?.length);
      return hasYoutubeLinks || hasFiles;
    },
  },
  'role-originality': {
    requiredFields: ['is_team_work', 'is_original_work'],
    validate: (formData) => {
      const teamWorkValid = !formData.is_team_work || Boolean(formData.team_contribution?.trim());
      const originalityValid = !formData.is_original_work || Boolean(formData.originality_explanation?.trim());
      return teamWorkValid && originalityValid;
    },
  },
  'skills-reflection': {
    requiredFields: ['selected_skills', 'skills_justification', 'pride_reason'],
  },
  'process-challenges': {
    requiredFields: ['creation_process', 'learnings', 'challenges', 'improvements', 'acknowledgments'],
  },
  'review-submit': {
    requiredFields: [],
    validate: (formData, service) => {
      return service.validateUpToStep('process-challenges', formData);
    },
  },
  'teacher-feedback': {
    requiredFields: [],
    validate: (formData, service) => {
      return service.validateUpToStep('process-challenges', formData);
    },
  },
};

// Cached validation result structure
interface ValidationCache {
  formDataHash: string;
  isValid: boolean;
  timestamp: number;
}

// Manages validation and navigation for a multi-step assignment form
export class StepService {
  private readonly steps: ReadonlyArray<StepConfig>;
  private readonly validationStatus: Map<AssignmentStep, boolean>;
  private readonly visitedSteps: Set<AssignmentStep>;
  private readonly validationCache: Map<AssignmentStep, ValidationCache>;
  private readonly cacheTimeoutMs = 5 * 60 * 1000; // 5 minutes

  constructor(steps: ReadonlyArray<StepConfig> = STEPS) {
    this.steps = steps;
    this.validationStatus = new Map(
      Object.keys(STEP_VALIDATION_CONFIG).map(stepId => [stepId as AssignmentStep, false])
    );
    this.visitedSteps = new Set();
    this.validationCache = new Map();
    debug.info("StepService initialized with steps:", this.steps.map(s => s.id));
  }

  // Resets all validation caches and state
  reset(): void {
    this.validationStatus.forEach((_, key) => {
      this.validationStatus.set(key, false);
    });
    this.visitedSteps.clear();
    this.validationCache.clear();
    debug.info("StepService state reset");
  }

  // Marks a step as visited for UI tracking
  markStepVisited(stepId: AssignmentStep): void {
    if (this.visitedSteps.has(stepId)) return;
    this.visitedSteps.add(stepId);
    debug.log(`Marked step ${stepId} as visited`);
  }

  // Clears validation cache for a specific step
  clearCache(stepId: AssignmentStep): void {
    this.validationCache.delete(stepId);
    debug.log(`Cleared validation cache for step: ${stepId}`);
  }

  // Validates a step's data, using cache if enabled
  validateStep(stepId: AssignmentStep, formData: AssignmentFormValues, useCache = true): boolean {
    if (!this.isValidStep(stepId)) {
      debug.error(`Unknown step: ${stepId}`);
      return false;
    }
    
    // First validate all previous steps
    const stepIndex = this.getStepIndex(stepId);
    if (stepIndex > 0) {
      // For any step beyond the first, validate all previous steps first
      for (let i = 0; i < stepIndex; i++) {
        const prevStepId = this.steps[i].id;
        if (!this.validateStep(prevStepId, formData, useCache)) {
          debug.log(`Step ${stepId} cannot be valid because previous step ${prevStepId} is invalid`);
          return false;
        }
      }
    }
    
    // Then check cache for current step
    if (useCache) {
      const cachedResult = this.getCachedValidation(stepId, formData);
      if (cachedResult !== null) {
        debug.log(`Using cached validation for ${stepId}: ${cachedResult}`);
        this.validationStatus.set(stepId, cachedResult);
        return cachedResult;
      }
    }
    
    // Validate current step
    const config = STEP_VALIDATION_CONFIG[stepId];
    const isValid = this.isStepDataValid(config, formData);
    this.validationStatus.set(stepId, isValid);
    this.cacheValidation(stepId, formData, isValid);
    debug.log(`Validated step ${stepId}: ${isValid}`);
    return isValid;
  }

  // Validates all steps up to the target step
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

  // Checks if navigation to a target step is allowed
  canNavigateToStep(targetStep: AssignmentStep, currentStep: AssignmentStep, formData: AssignmentFormValues): boolean {
    if (!this.isValidStep(targetStep) || !this.isValidStep(currentStep)) {
      debug.warn(`Invalid navigation from ${currentStep} to ${targetStep}`);
      return false;
    }
    
    if (targetStep === currentStep) return true;
    
    const status = this.getAssignmentStatus(formData);
    
    // For SUBMITTED status, allow navigation to any tab
    if (status === ASSIGNMENT_STATUS.SUBMITTED) {
      return true;
    }
    
    // For APPROVED status, only allow teacher-feedback
    if (status === ASSIGNMENT_STATUS.APPROVED) {
      return targetStep === 'teacher-feedback';
    }
    
    // For non-restricted statuses, allow backward navigation or if all previous steps are valid
    const targetIndex = this.getStepIndex(targetStep);
    const currentIndex = this.getStepIndex(currentStep);
    
    // Always allow going backward
    if (targetIndex < currentIndex) return true;
    
    // For forward navigation, validate all steps up to the target
    return this.validateUpToStep(targetStep, formData);
  }

  // Returns the next step ID if the current step is valid
  getNextStep(currentStep: AssignmentStep, formData: AssignmentFormValues): AssignmentStep | null {
    if (!this.isValidStep(currentStep)) {
      debug.warn(`Invalid step: ${currentStep}`);
      return null;
    }
    
    const status = this.getAssignmentStatus(formData);
    
    // For APPROVED status, always go to teacher-feedback
    if (status === ASSIGNMENT_STATUS.APPROVED) {
      return 'teacher-feedback';
    }
    
    const currentIndex = this.getStepIndex(currentStep);
    if (currentIndex === -1 || currentIndex === this.steps.length - 1) return null;
    if (!this.validateStep(currentStep, formData)) {
      debug.log(`Cannot proceed from ${currentStep}: step is invalid`);
      return null;
    }
    return this.steps[currentIndex + 1].id;
  }

  // Returns the previous step ID if available
  getPreviousStep(currentStep: AssignmentStep, formData: AssignmentFormValues): AssignmentStep | null {
    if (!this.isValidStep(currentStep)) {
      debug.warn(`Invalid step: ${currentStep}`);
      return null;
    }
    
    const status = this.getAssignmentStatus(formData);
    
    // For APPROVED status, prevent backward navigation
    if (status === ASSIGNMENT_STATUS.APPROVED) {
      return null;
    }
    
    const currentIndex = this.getStepIndex(currentStep);
    if (currentIndex <= 0) return null;
    return this.steps[currentIndex - 1].id;
  }

  // Looks up a step config by its ID
  getStepById(stepId: AssignmentStep): StepConfig | undefined {
    return this.steps.find(s => s.id === stepId);
  }

  // Gets the index of a step in the sequence
  getStepIndex(stepId: AssignmentStep): number {
    return this.steps.findIndex(s => s.id === stepId);
  }

  // Returns the next incomplete step ID after validating form data
  getNextIncompleteStep(formData: AssignmentFormValues): AssignmentStep {
    const status = this.getAssignmentStatus(formData);
    
    // For APPROVED status, go to teacher-feedback
    if (status === ASSIGNMENT_STATUS.APPROVED) {
      debug.log("APPROVED status detected, returning teacher-feedback");
      return 'teacher-feedback';
    }
    
    for (const step of this.steps) {
      if (!this.validateStep(step.id, formData)) {
        debug.log(`Next incomplete step: ${step.id}`);
        return step.id;
      }
    }
    
    // All steps are complete, go to review step
    debug.log("All steps complete, going to review step");
    return 'review-submit';
  }

  // Checks if a step ID is valid
  private isValidStep(stepId: string): stepId is AssignmentStep {
    return this.steps.some(s => s.id === stepId);
  }

  // Extracts assignment status from form data with fallback to DRAFT
  private getAssignmentStatus(formData: AssignmentFormValues): AssignmentStatus {
    return formData?.status || ASSIGNMENT_STATUS.DRAFT;
  }

  // Creates a simple hash of form data for caching
  private hashFormData(formData: AssignmentFormValues, stepId: AssignmentStep): string {
    const config = STEP_VALIDATION_CONFIG[stepId];
    const relevantData: Record<string, unknown> = {};
    config.requiredFields.forEach(field => {
      relevantData[field] = formData[field];
    });
    return JSON.stringify(relevantData);
  }

  // Gets a cached validation result if available and not expired
  private getCachedValidation(stepId: AssignmentStep, formData: AssignmentFormValues): boolean | null {
    const cache = this.validationCache.get(stepId);
    if (!cache) return null;
    
    const now = Date.now();
    const isExpired = now - cache.timestamp > this.cacheTimeoutMs;
    if (isExpired) {
      this.validationCache.delete(stepId);
      return null;
    }
    
    const currentHash = this.hashFormData(formData, stepId);
    if (currentHash !== cache.formDataHash) return null;
    
    return cache.isValid;
  }

  // Stores a validation result in the cache
  private cacheValidation(stepId: AssignmentStep, formData: AssignmentFormValues, isValid: boolean): void {
    const hash = this.hashFormData(formData, stepId);
    this.validationCache.set(stepId, {
      formDataHash: hash,
      isValid,
      timestamp: Date.now()
    });
  }

  // Validates step data against its configuration
  private isStepDataValid(config: typeof STEP_VALIDATION_CONFIG[AssignmentStep], formData: AssignmentFormValues): boolean {
    const fieldsValid = config.requiredFields.every(field => {
      const value = formData[field];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'boolean') return value !== undefined && value !== null;
      return value != null && value !== '';
    });
    const customValid = config.validate ? config.validate(formData, this) : true;
    return fieldsValid && customValid;
  }

  // Gets all step IDs
  getStepIds(): AssignmentStep[] {
    return this.steps.map(s => s.id as AssignmentStep);
  }

  // Checks if the form is editable based on status
  isEditable(status: AssignmentStatus): boolean {
    return !isRestrictedStatus(status);
  }
}