import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  assignmentFormSchema,
  type AssignmentFormValues,
} from "@/lib/validations/assignment";
import { type AssignmentStep } from "@/types/assignment";
import { User } from "@supabase/supabase-js";
import { STEPS } from "@/lib/config/steps";
import { getAssignmentFiles } from "@/lib/services/file-upload.service";

// Import services from their new locations
import { debug } from "@/lib/utils/debug.service";
import { ToastService } from "@/lib/services/toast.service";
import { AssignmentService } from "@/lib/services/assignment.service";
import { StepService } from "@/lib/services/step.service";
import { getDefaultValues } from "@/lib/services/assignment-defaults.service";

// Text fields that should never be null
const TEXT_FIELDS = [
  'originality_explanation',
  'team_contribution',
  'skills_justification',
  'pride_reason',
  'creation_process',
  'learnings',
  'challenges',
  'improvements',
  'acknowledgments'
] as const;

// Normalize text fields to convert null to empty string
const normalizeTextFields = (data: AssignmentFormValues): AssignmentFormValues => {
  const cleanData = { ...data };
  TEXT_FIELDS.forEach(field => {
    if (cleanData[field] === null) {
      (cleanData as Record<string, string>)[field] = "";
    }
  });
  return cleanData;
};

// Custom hook for managing assignment form state and logic
export function useAssignmentForm({ user }: { user: User }) {
  const { id } = useParams(); // Assignment ID from URL
  const navigate = useNavigate(); // Navigation function
  const [currentStep, setCurrentStep] = useState<AssignmentStep>("basic-info"); // Current form step
  const [isLoading, setIsLoading] = useState(false); // Loading state

  debug.log("Hook initialized with:", { userId: user?.id, assignmentId: id, currentStep });

  // Initialize form with schema validation
  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      ...getDefaultValues(),
      grade: user?.user_metadata?.grade ?? "",
    },
  });

  // Ensure text fields are never null
  useEffect(() => {
    const formValues = form.getValues();
    let needsUpdate = false;
    const updates: Record<string, string> = {};

    // Check each field and convert null to empty string
    TEXT_FIELDS.forEach(field => {
      if (formValues[field] === null) {
        updates[field] = "";
        needsUpdate = true;
      }
    });

    // If any nulls were found, update the form
    if (needsUpdate) {
      debug.log("Converting null text fields to empty strings", updates);
      form.reset({ ...formValues, ...updates }, { keepDirty: true });
    }
  }, [form]);

  debug.log("Form initialized with default values:", { 
    grade: user?.user_metadata?.grade,
    defaultValues: getDefaultValues() 
  });

  // Instantiate services
  const toastService = new ToastService();
  const assignmentService = new AssignmentService(
    toastService,
    navigate,
    user?.id
  );
  const stepService = new StepService();

  debug.log("Services initialized");

  // Load assignment files
  const loadAssignmentFiles = async (assignmentId: string) => {
    debug.log("Starting file loading for assignment", { assignmentId });
    try {
      const existingFiles = await getAssignmentFiles(assignmentId);
      debug.log("Files loaded successfully", { 
        fileCount: existingFiles?.length,
        files: existingFiles 
      });
      form.setValue("files", existingFiles);
    } catch (error) {
      debug.error("Failed to load files", error);
      toastService.error("Failed to load existing files");
    }
  };

  // Process loaded assignment data
  const processAssignmentData = (assignment: AssignmentFormValues | null) => {
    if (!assignment) {
      debug.log("No existing assignment found, using default values");
      return;
    }
    
    // Normalize text fields
    const cleanAssignment = normalizeTextFields(assignment);
    
    debug.log("Resetting form with assignment data");
    form.reset(cleanAssignment);
    
    debug.log("Marking current step as visited", { currentStep });
    stepService.markStepVisited(currentStep);
    
    debug.log("Validating previous steps");
    STEPS.forEach((step) => {
      stepService.markStepVisited(step.id); // Mark all steps as visited
      const isValid = stepService.validateStep(step.id, assignment);
      debug.log("Step validation result", { step: step.id, isValid });
    });

    // Load assignment files if assignment ID exists
    if (assignment.id) {
      loadAssignmentFiles(assignment.id);
    }
  };

  // Initialize form with new or existing assignment data
  useEffect(() => {
    const initialize = async () => {
      debug.log("Starting assignment initialization", { id, userId: user?.id });
      setIsLoading(true);
      try {
        debug.log("Fetching assignment data");
        const assignment = await assignmentService.initialize(id);
        debug.log("Assignment data received", { assignment });
        processAssignmentData(assignment);
      } catch (error) {
        debug.error("Assignment initialization failed", error);
        toastService.error("Failed to load assignment");
      } finally {
        setIsLoading(false);
        debug.log("Assignment initialization completed");
      }
    };
    initialize();
  }, [id, user?.id]);

  // Auto-save form changes after a delay
  useEffect(() => {
    debug.log("Setting up form auto-save watcher");
    
    const subscription = form.watch((value) => {
      if (!value.id) {
        debug.log("Skipping auto-save - no assignment ID");
        return;
      }

      debug.log("Form value changed, scheduling auto-save", { 
        assignmentId: value.id,
        changedFields: Object.keys(form.formState.dirtyFields)
      });

      const saveTimeout = setTimeout(() => {
        debug.log("Executing auto-save");
        assignmentService.autoSave(value.id!, value).catch((error) => {
          debug.error("Auto-save failed", error);
          toastService.error("Failed to save changes");
        });
      }, 1000);

      return () => {
        debug.log("Clearing auto-save timeout");
        clearTimeout(saveTimeout);
      };
    });

    return () => {
      debug.log("Cleaning up form watcher subscription");
      subscription.unsubscribe();
    };
  }, [form]);

  // Navigate to a specific step
  const navigateToStep = (targetStep: AssignmentStep) => {
    debug.log("Attempting to navigate to step", { from: currentStep, to: targetStep });
    
    const formData = form.getValues();
    debug.log("Current form data", { formData });

    if (stepService.canNavigateToStep(targetStep, currentStep, formData)) {
      debug.log("Navigation allowed, updating step");
      stepService.markStepVisited(targetStep);
      setCurrentStep(targetStep);
    } else {
      debug.log("Navigation blocked - incomplete required fields");
      toastService.error("Please complete all required fields before proceeding");
    }
  };

  // Navigate to the next step if available
  const nextStep = () => {
    const formData = form.getValues();
    debug.log("Attempting to move to next step", { currentStep, formData });
    
    const next = stepService.getNext(currentStep, formData);

    if (next) {
      debug.log("Moving to next step", { from: currentStep, to: next });
      stepService.markStepVisited(next);
      setCurrentStep(next);
    } else {
      debug.log("Cannot move to next step - validation failed");
      toastService.error("Please complete all required fields before proceeding");
    }
  };

  // Navigate to the previous step if available
  const previousStep = () => {
    debug.log("Attempting to move to previous step", { currentStep });
    
    const prev = stepService.getPrevious(currentStep);
    if (prev) {
      debug.log("Moving to previous step", { from: currentStep, to: prev });
      setCurrentStep(prev);
    } else {
      debug.log("No previous step available");
    }
  };

  // Check if current step is complete
  const isCurrentStepComplete = () => {
    const formData = form.getValues();
    // Always mark the current step as visited to ensure validation works
    stepService.markStepVisited(currentStep);
    const isValid = stepService.validateStep(currentStep, formData);
    debug.log("Checking current step completion", { step: currentStep, isValid, formData });
    return isValid;
  };

  // Handle form submission
  const onSubmit = async (data: AssignmentFormValues) => {
    debug.log("Starting form submission", { data });
    
    // Validate all steps before submission
    const stepValidations = STEPS.map(step => ({
      step: step.id,
      isValid: stepService.validateStep(step.id, data)
    }));
    
    debug.log("Step validations", { stepValidations });
    
    const isValid = stepValidations.every(v => v.isValid);

    if (!isValid) {
      debug.log("Submission blocked - invalid steps", {
        invalidSteps: stepValidations.filter(v => !v.isValid).map(v => v.step)
      });
      toastService.error("Please complete all required fields before submitting");
      return;
    }

    setIsLoading(true);
    try {
      debug.log("Submitting assignment");
      await assignmentService.submit(data);
      debug.log("Assignment submitted successfully");
    } catch (error) {
      debug.error("Submission failed", error);
      toastService.error("Failed to submit assignment");
    } finally {
      setIsLoading(false);
      debug.log("Submission process completed");
    }
  };

  return {
    form,
    currentStep,
    setCurrentStep: navigateToStep,
    nextStep,
    previousStep,
    isCurrentStepComplete,
    validateStep: (stepId: AssignmentStep, data: AssignmentFormValues) => {
      const isValid = stepService.validateStep(stepId, data);
      debug.log("Step validation requested", { step: stepId, isValid });
      return isValid;
    },
    onSubmit: form.handleSubmit(onSubmit),
    isLoading,
  };
}
