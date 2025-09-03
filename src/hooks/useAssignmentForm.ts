import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  assignmentFormSchema,
  baseAssignmentFormSchema,
  type AssignmentFormValues,
} from "@/lib/validations/assignment";
import { type AssignmentStep } from "@/types/assignment";
import { ASSIGNMENT_STATUS } from "@/constants/assignment-status";
import { STEPS } from "@/lib/config/steps";
import { ToastService } from "@/lib/services/toast.service";
import { StepService } from "@/lib/services/step.service";
import { getDefaultValues } from "@/lib/services/assignment-defaults.service";
import { ROUTES } from "@/config/routes";
import { logger } from "@/lib/logger";
import {
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentWithFiles,
} from "@/api/assignment";
import { ASSIGNMENT_KEYS } from "@/query-key/student-assignment";
import { isBasicInfoComplete } from "@/lib/utils/basic-info-validation";

// Constants
const AUTO_SAVE_DELAY = 5000;
const toast = new ToastService();
const steps = new StepService(STEPS);
const formLogger = logger.forModule("useAssignmentForm");

/**
 * Hook for managing the multi-step assignment form
 */
function useAssignmentForm({ user }: { user: User }) {
  const { id: assignmentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Check if this is a new assignment (either ":id" or "new")
  const isNewAssignment = assignmentId === ":id" || assignmentId === "new";
  const isEditing = !!assignmentId && !isNewAssignment;

  // Form setup
  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: getDefaultValues(),
    mode: "onTouched",
    criteriaMode: "all",
    shouldFocusError: true,
    shouldUnregister: false,
    shouldUseNativeValidation: false,
  });

  // State
  const [currentStep, setCurrentStep] = useState<AssignmentStep>("basic-info");
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [manualEditEnabled, setManualEditEnabled] = useState<boolean>(false);

  // ===== Data Mutations =====

  // Create a new assignment
  const createMutation = useMutation({
    mutationFn: (data: Omit<AssignmentFormValues, "id">) => {
      formLogger.info("Creating new assignment", { studentId: user.id });
      return createAssignment(data);
    },
    onSuccess: (response) => {
      if (!response?.id) {
        console.error("Assignment created but no ID returned");
        return;
      }

      formLogger.info("Assignment created successfully", {
        assignmentId: response.id,
      });

      // Reset form with new data
      form.reset(
        baseAssignmentFormSchema.parse({
          ...getDefaultValues(),
          ...response,
          id: response.id,
        }),
        { keepDirty: true }
      );

      // Navigate to the actual assignment URL with the real ID
      const newUrl = ROUTES.STUDENT.MANAGE_ASSIGNMENT.replace(":id", response.id);
      navigate(newUrl, {
        replace: true,
      });
    },
    onError: (error) => {
      console.error("Assignment creation failed:", error);
      formLogger.error("Failed to create assignment", { error });
      toast.error(`Failed to create assignment: ${error.message}`);
    },
  });

  // Fetch assignment data
  const fetchAssignmentData = async () => {
    try {
      // Special case: ":id" or "new" are placeholders, not an actual ID
      if (assignmentId === ":id" || assignmentId === "new") {
        return null; // This will trigger creation of a new assignment
      }

      formLogger.debug("Fetching assignment data", { assignmentId });
      
      const response = await getAssignmentWithFiles(assignmentId, user.id);

      if (!response) {
        console.warn("No assignment data returned for ID:", assignmentId);
        formLogger.warn("Invalid assignment response", { assignmentId });
        throw new Error("Invalid assignment response");
      }

      if (typeof response !== "object" || !("id" in response)) {
        console.error("Response missing ID field:", response);
        formLogger.warn("Response missing ID field", { response });
        return null;
      }

      // Process and parse response data
      const parsedData = baseAssignmentFormSchema.parse(response as AssignmentFormValues);
      formLogger.debug("Assignment fetched successfully", { 
        id: response.id, 
        hasData: !!parsedData,
        fieldCount: Object.keys(parsedData).length 
      });
      
      // DEBUG: Log current form state before reset
      const beforeReset = form.getValues();
      formLogger.debug("Form state BEFORE reset", { 
        title: beforeReset.title,
        subject: beforeReset.subject,
        artifact_type: beforeReset.artifact_type,
        allFieldsCount: Object.keys(beforeReset).length
      });
      
      // DEBUG: Log parsed data being passed to reset
      formLogger.debug("Parsed data being passed to form.reset", {
        title: parsedData.title,
        subject: parsedData.subject,
        artifact_type: parsedData.artifact_type,
        allFieldsCount: Object.keys(parsedData).length,
        hasAllRequiredFields: !!(parsedData.title && parsedData.subject && parsedData.artifact_type)
      });
      
      // Reset form with fresh data, don't keep dirty state
      form.reset(parsedData, { keepDirty: false });
      
      // DEBUG: Immediately check if form ID was set correctly
      const resetFormValues = form.getValues();
      formLogger.debug("Form ID CHECK after reset", {
        parsedDataId: parsedData.id,
        formIdAfterReset: resetFormValues.id,
        idCorrectlySet: parsedData.id === resetFormValues.id,
        formHasAllBasicFields: !!(resetFormValues.title || resetFormValues.subject || resetFormValues.artifact_type)
      });
      
      // DEBUG: Immediately check form state after reset
      const afterReset = form.getValues();
      formLogger.debug("Form state IMMEDIATELY after reset", { 
        title: afterReset.title,
        subject: afterReset.subject,
        artifact_type: afterReset.artifact_type,
        allFieldsCount: Object.keys(afterReset).length,
        fieldsPopulated: !!(afterReset.title && afterReset.subject && afterReset.artifact_type)
      });
      
      // Delay step determination to ensure form is fully populated
      setTimeout(() => {
        // DEBUG: Check form state when step determination runs
        const duringStepCheck = form.getValues();
        formLogger.debug("Form state DURING step determination", { 
          title: duringStepCheck.title,
          subject: duringStepCheck.subject,
          artifact_type: duringStepCheck.artifact_type,
          fieldsPopulated: !!(duringStepCheck.title && duringStepCheck.subject && duringStepCheck.artifact_type)
        });
        
        const nextStep = steps.getNextIncompleteStep(parsedData);
        formLogger.debug("Setting current step after data load", { nextStep });
        setCurrentStep(nextStep);
        
        // DEBUG: Also test step determination with current form values
        const stepWithFormValues = steps.getNextIncompleteStep(duringStepCheck);
        formLogger.debug("Step determination comparison", {
          stepWithParsedData: nextStep,
          stepWithFormValues: stepWithFormValues,
          shouldMatch: nextStep === stepWithFormValues
        });
      }, 100);
      
      return null;
    } catch (error) {
      console.error("Error fetching assignment:", error);
      formLogger.error("Error fetching assignment", { assignmentId, error });
      toast.error(`Error loading assignment: ${error.message}`);
      throw error;
    }
  };

  // Update an existing assignment
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<AssignmentFormValues>;
    }) => {
      formLogger.debug("UPDATE MUTATION: Starting API call", {
        id,
        fields: Object.keys(data),
        dataSnapshot: {
          title: data.title,
          subject: data.subject,
          artifact_type: data.artifact_type,
          fieldCount: Object.keys(data).length
        }
      });
      
      const result = await updateAssignment(id, user.id, data);
      
      // Check if the result is an error object
      if (result && typeof result === 'object' && 'message' in result) {
        formLogger.error("UPDATE MUTATION: API returned error", {
          id,
          error: result.message,
          errorDetails: result
        });
        throw new Error(result.message || 'Database update failed');
      }
      
      return result;
    },
    onSuccess: (result, { id, data }) => {
      formLogger.debug("UPDATE MUTATION: Success", { 
        id,
        updatedFields: Object.keys(data),
        resultData: {
          title: result?.title,
          subject: result?.subject,
          artifact_type: result?.artifact_type
        }
      });
      queryClient.setQueryData(
        ASSIGNMENT_KEYS.detail(id),
        (old: AssignmentFormValues) => ({
          ...(old as AssignmentFormValues),
          ...data,
          updated_at: new Date().toISOString(),
        })
      );
    },
    onError: (error, { id, data }) => {
      formLogger.error("UPDATE MUTATION: Failed", { 
        id,
        error: error.message,
        attemptedData: {
          title: data.title,
          subject: data.subject,
          artifact_type: data.artifact_type
        }
      });
      toast.error(`Failed to update assignment: ${error.message}`);
    },
  });

  // Delete an assignment
  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      formLogger.info("Deleting assignment", { id });
      return deleteAssignment(id, user.id);
    },
    onSuccess: () => {
      formLogger.info("Assignment deleted successfully", { id: assignmentId });
      queryClient.removeQueries({
        queryKey: ASSIGNMENT_KEYS.detail(assignmentId),
      });
      navigate(ROUTES.STUDENT.DASHBOARD);
      toast.success("Assignment deleted successfully");
    },
    onError: (error) => {
      formLogger.error("Failed to delete assignment", {
        id: assignmentId,
        error,
      });
      toast.error(`Failed to delete assignment: ${error.message}`);
    },
  });

  // ===== Data Fetching =====

  // Fetch or create assignment data
  const { isLoading: isDataLoading } = useQuery({
    queryKey: ASSIGNMENT_KEYS.detail(assignmentId),
    queryFn: async () => {
      // Create new assignment if needed
      if (isNewAssignment) {
        
        // Skip creation if already in progress or succeeded
        if (createMutation.isPending || createMutation.isSuccess) {
          return null;
        }

        formLogger.info("Initializing new assignment", { userId: user.id });
        const initialData = {
          ...getDefaultValues(),
          student_id: user.id,
          status: ASSIGNMENT_STATUS.DRAFT,
        };
        createMutation.mutate(initialData);
        return null;
      }

      // Always fetch assignment data on mount for existing assignments
      // This ensures data persistence after page refresh
      if (assignmentId) {
        formLogger.debug("Fetching assignment data for persistence check", { 
          assignmentId,
          currentFormId: form.getValues().id 
        });
        return fetchAssignmentData();
      }

      return null;
    },
    // Enable query for existing assignments to ensure data loads on refresh
    enabled: Boolean(assignmentId) && !createMutation.isSuccess,
    // Prevent auto-refetching to avoid unnecessary calls
    refetchOnWindowFocus: false,
    retry: isNewAssignment ? 0 : 3, // Don't retry for new assignments
    refetchOnMount: true, // Force refetch on mount for data persistence
    // Ensure stale data is refetched
    staleTime: 0,
  });

  // ===== Auto-Save Logic =====

  // Save form data
  const saveData = useCallback(
    async (id: string, data: AssignmentFormValues) => {
      if (updateMutation.isPending) {
        formLogger.debug("SAVE DATA: Update already pending, skipping", { id });
        return;
      }

      formLogger.debug("SAVE DATA: Starting save", { 
        id,
        dataToSave: {
          title: data.title,
          subject: data.subject,
          artifact_type: data.artifact_type,
          totalFields: Object.keys(data).length
        },
        updateMutationState: {
          isPending: updateMutation.isPending,
          isIdle: updateMutation.isIdle
        }
      });

      const { files, ...dataWithoutFiles } = data;
      
      formLogger.debug("SAVE DATA: Calling updateMutation", { 
        id, 
        fieldsToUpdate: Object.keys(dataWithoutFiles).length,
        sampleFields: {
          title: dataWithoutFiles.title,
          subject: dataWithoutFiles.subject,
          artifact_type: dataWithoutFiles.artifact_type
        }
      });
      
      await updateMutation.mutateAsync({ id, data: dataWithoutFiles });
    },
    [updateMutation]
  );

  // Debounced auto-save function
  const debouncedAutoSave = useCallback(
    (id: string, data: AssignmentFormValues) => {
      if (autoSaveTimeout) clearTimeout(autoSaveTimeout);

      formLogger.debug("DEBOUNCED AUTO-SAVE: Setting up timeout", { 
        id, 
        delay: AUTO_SAVE_DELAY,
        dataFields: Object.keys(data).length,
        sampleData: {
          title: data.title,
          subject: data.subject,
          artifact_type: data.artifact_type
        }
      });

      const timeout = setTimeout(() => {
        formLogger.debug("DEBOUNCED AUTO-SAVE: Executing", { 
          id,
          currentFormData: {
            title: form.getValues().title,
            subject: form.getValues().subject,
            artifact_type: form.getValues().artifact_type
          }
        });
        saveData(id, form.getValues());
        setAutoSaveTimeout(null);
      }, AUTO_SAVE_DELAY);

      setAutoSaveTimeout(timeout);
    },
    [autoSaveTimeout, saveData, form]
  );

  // Watch for form changes and trigger auto-save
  useEffect(() => {
    formLogger.debug("Setting up form change subscription");

    const subscription = form.watch((data) => {
      const formId = data?.id;
      const isDirty = Object.keys(form.formState.dirtyFields).length > 0;
      const isEditable = formId && steps.isEditable(data.status);

      // ENHANCED DEBUG: Log all auto-save conditions
      formLogger.debug("AUTO-SAVE CHECK", {
        hasFormId: !!formId,
        formId: formId,
        isDirty: isDirty,
        dirtyFieldsCount: Object.keys(form.formState.dirtyFields).length,
        dirtyFields: Object.keys(form.formState.dirtyFields),
        isEditable: isEditable,
        status: data.status,
        isDataLoading: isDataLoading,
        willTriggerAutoSave: formId && isEditable && isDirty && !isDataLoading
      });

      // Skip auto-save during initial data load to prevent interference
      if (isDataLoading) {
        formLogger.debug("Skipping auto-save during data loading");
        return;
      }

      if (formId && isEditable && isDirty) {
        formLogger.debug("Form data changed, triggering auto-save", {
          id: formId,
          status: data.status,
          dirtyFieldsCount: Object.keys(form.formState.dirtyFields).length,
          changedFields: Object.keys(form.formState.dirtyFields),
          sampleData: {
            title: data.title,
            subject: data.subject,
            artifact_type: data.artifact_type
          }
        });
        debouncedAutoSave(formId, data);
      } else {
        formLogger.debug("Auto-save conditions not met", {
          hasFormId: !!formId,
          isEditable: isEditable,
          isDirty: isDirty,
          reason: !formId ? "No form ID" : 
                  !isEditable ? "Not editable" : 
                  !isDirty ? "No dirty fields" : "Unknown"
        });
      }
    });

    // Cleanup function
    return () => {
      formLogger.debug("Cleaning up form watch subscription");
      subscription.unsubscribe();

      // Final save on unmount if needed
      if (autoSaveTimeout) {
        formLogger.debug("Performing final save on unmount");
        clearTimeout(autoSaveTimeout);

        const formId = form.getValues().id;
        // Only save if we have a valid ID and are not in the middle of creating a new assignment
        if (formId && !isNewAssignment && !createMutation.isPending) {
          saveData(formId, form.getValues()).catch((error) => {
            formLogger.error("Final save failed", { error });
            toast.error("Final save failed");
          });
        }
      }
    };
  }, [
    form,
    debouncedAutoSave,
    autoSaveTimeout,
    saveData,
    isNewAssignment,
    createMutation.isPending,
    isDataLoading,
  ]);

  // ===== Step Management =====

  // Validate a specific step
  const validateStep = useCallback(
    (stepId: AssignmentStep) => {
      const isValid = steps.validateStep(stepId, form.getValues());
      formLogger.debug("Validating step", { step: stepId, isValid });
      return isValid;
    },
    [form]
  );

  // Check if current step is complete
  const isCurrentStepComplete = useCallback(() => {
    const isComplete = validateStep(currentStep);
    formLogger.debug("Checking step completion", {
      step: currentStep,
      isComplete,
    });
    return isComplete;
  }, [currentStep, validateStep]);

  // Handle save and navigation to next step
  const handleSaveAndContinue = useCallback(async () => {
    formLogger.info("Save and continue initiated", { currentStep });

    const data = form.getValues();
    if (!data.id) {
      formLogger.error("Save and continue attempted without assignment ID");
      return;
    }
    await handleAdvanceToNextStep(data);
  }, [currentStep, form]);

  // Handle assignment submission
  const handleSubmitAssignment = async (data: AssignmentFormValues) => {
    try {
      formLogger.info("=== SUBMISSION PROCESS STARTED ===", { 
        id: data.id,
        currentStatus: data.status,
        hasId: !!data.id
      });
      
      // Step 1: Validate entire assignment
      formLogger.info("Step 1: Validating entire assignment", { id: data.id });
      const isValid = await form.trigger();
      
      if (!isValid) {
        const errors = form.formState.errors;
        formLogger.error("VALIDATION FAILED", { 
          id: data.id,
          errors: errors,
          errorCount: Object.keys(errors).length,
          errorFields: Object.keys(errors)
        });
        handleValidationErrors();
        return;
      }
      
      formLogger.info("Step 2: Validation PASSED - proceeding with submission", { id: data.id });

      // Step 2: Check if assignment is editable
      if (!steps.isEditable(data.status)) {
        formLogger.error("SUBMISSION BLOCKED - Assignment not editable", {
          id: data.id,
          status: data.status,
          isEditable: steps.isEditable(data.status)
        });
        toast.error("Cannot submit assignment in current status");
        return;
      }

      // Step 3: Submit the assignment
      formLogger.info("Step 3: Submitting assignment to database", { 
        id: data.id,
        currentStatus: data.status,
        newStatus: ASSIGNMENT_STATUS.SUBMITTED
      });
      
      const updateData = {
        status: ASSIGNMENT_STATUS.SUBMITTED,
        submitted_at: new Date().toISOString(),
      };
      
      formLogger.debug("Submission data prepared", {
        id: data.id,
        updateData: updateData
      });

      await updateMutation.mutateAsync({
        id: data.id,
        data: updateData,
      });

      formLogger.info("Step 4: Database update SUCCESSFUL", { 
        id: data.id,
        newStatus: ASSIGNMENT_STATUS.SUBMITTED
      });

      // Step 4: Success feedback and update form state
      formLogger.info("Step 4: Assignment submission SUCCESS", { 
        id: data.id,
        newStatus: ASSIGNMENT_STATUS.SUBMITTED
      });
      
      // Update form with new status immediately
      form.setValue("status", ASSIGNMENT_STATUS.SUBMITTED);
      
      // Invalidate React Query cache to refetch fresh data
      queryClient.invalidateQueries({
        queryKey: ASSIGNMENT_KEYS.detail(data.id),
      });
      
      toast.success("Assignment submitted successfully");
      
    } catch (error) {
      formLogger.error("SUBMISSION PROCESS FAILED", {
        id: data.id,
        error: error.message,
        errorStack: error.stack,
        currentStatus: data.status
      });
      
      // Show user-friendly error message
      toast.error(`Submission failed: ${error.message || 'Unknown error'}`);
      
      // Don't reload on error - let user try again
    }
  };

  // Handle validation errors by navigating to problematic step
  const handleValidationErrors = () => {
    const errors = form.formState.errors;
    formLogger.warn("[onSubmit] Validation errors found", { errors });

    const errorStep = steps.findStepWithErrors(errors);
    if (errorStep && errorStep !== currentStep) {
      formLogger.info("[onSubmit] Navigating to step with errors", {
        step: errorStep,
      });
      setCurrentStep(errorStep);
      toast.error("Please fix the errors before submitting");
    }
  };

  // Save and advance to next step
  const handleAdvanceToNextStep = async (data: AssignmentFormValues) => {
    formLogger.debug("Saving and advancing to next step", { currentStep });
    await saveData(data.id, data);

    const next = steps.getNextStep(currentStep, data);
    if (next) {
      formLogger.info("Advancing to next step", {
        from: currentStep,
        to: next,
      });
      setCurrentStep(next);
      toast.success("Saved and continued");
    }
  };

  // Navigate to previous step
  const previousStep = useCallback(() => {
    const prev = steps.getPreviousStep(currentStep, form.getValues());
    if (prev) {
      formLogger.info("Navigating to previous step", {
        from: currentStep,
        to: prev,
      });
      setCurrentStep(prev);
    } else {
      formLogger.warn("Cannot navigate to previous step", { currentStep });
    }
  }, [currentStep, form]);

  // Delete the current assignment
  const handleDeleteAssignment = useCallback(() => {
    const id = form.getValues("id");
    if (id) {
      formLogger.info("Initiating assignment deletion", { id });
      deleteMutation.mutate(id);
    } else {
      formLogger.warn("Delete attempted without assignment ID");
    }
  }, [form, deleteMutation]);

  // ===== Derived States =====

  // Global loading state
  const isLoading = useMemo(() => {
    // If we're navigating from a new assignment to a created one, don't show loading
    if (isNewAssignment && createMutation.isSuccess) return false;

    // If we have a valid form ID, don't show loading
    if (form.getValues().id) return false;

    // Otherwise, check all loading states
    return Boolean(
      isDataLoading ||
        createMutation.isPending ||
        updateMutation.isPending ||
        deleteMutation.isPending
    );
  }, [
    isDataLoading,
    createMutation.isPending,
    createMutation.isSuccess,
    updateMutation.isPending,
    deleteMutation.isPending,
    form,
    isNewAssignment,
  ]);

  // Disable continue button when form is not editable or loading
  // For continue button, still require files (use full validation)
  const isContinueDisabled = useMemo(() => {
    const formValues = form.getValues();
    
    return (
      isLoading ||
      (!manualEditEnabled && !steps.isEditable(formValues.status)) ||
      !isBasicInfoComplete(formValues)
    );
  }, [
    isLoading, 
    manualEditEnabled,
    form.watch('title'),
    form.watch('artifact_type'),
    form.watch('subject'),
    form.watch('month'),
    form.watch('status'),
    form.watch('files'),
    form.watch('youtubelinks')
  ]);

  // Public interface
  return {
    form,
    currentStep,
    setCurrentStep,
    handleSaveAndContinue,
    previousStep,
    isCurrentStepComplete,
    validateStep,
    isLoading,
    isEditing,
    handleDeleteAssignment,
    isContinueDisabled,
    handleSubmitAssignment,
    manualEditEnabled,
    setManualEditEnabled,
    saveData, // Add saveData for draft saving without validation
  };
}

export { useAssignmentForm };