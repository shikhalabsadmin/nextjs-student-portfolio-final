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
  const isNewAssignment = assignmentId === ":id";
  const isEditing = !!assignmentId && !isNewAssignment;

  // Form setup
  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: getDefaultValues(),
    mode: "onBlur",
  });

  // State
  const [currentStep, setCurrentStep] = useState<AssignmentStep>("basic-info");
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // ===== Data Mutations =====

  // Create a new assignment
  const createMutation = useMutation({
    mutationFn: (data: Omit<AssignmentFormValues, "id">) => {
      formLogger.info("Creating new assignment", { studentId: user.id });
      return createAssignment(data);
    },
    onSuccess: (response) => {
      if (!response?.id) return;

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

      navigate(ROUTES.STUDENT.MANAGE_ASSIGNMENT.replace(":id", response.id), {
        replace: true,
      });
    },
    onError: (error) => {
      formLogger.error("Failed to create assignment", { error });
      toast.error(`Failed to create assignment: ${error.message}`);
    },
  });

  // Fetch assignment data
  const fetchAssignmentData = async () => {
    try {
      formLogger.debug("Fetching assignment data", { assignmentId });
      const response = await getAssignmentWithFiles(assignmentId, user.id);

      if (!response) {
        formLogger.warn("Invalid assignment response", { assignmentId });
        throw new Error("Invalid assignment response");
      }

      if (typeof response !== "object" || !("id" in response)) {
        formLogger.warn("Response missing ID field", { response });
        return null;
      }

      // Process response data
      formLogger.debug("Assignment fetched successfully", { id: response.id });
      form.reset(
        baseAssignmentFormSchema.parse(response as AssignmentFormValues),
        { keepDirty: true }
      );
      setCurrentStep(
        steps.getNextIncompleteStep(response as AssignmentFormValues)
      );
      return null;
    } catch (error) {
      formLogger.error("Error fetching assignment", { assignmentId, error });
      toast.error(`Error loading assignment: ${error.message}`);
      throw error;
    }
  };

  // Update an existing assignment
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<AssignmentFormValues>;
    }) => {
      formLogger.debug("Updating assignment", {
        id,
        fields: Object.keys(data),
      });
      return updateAssignment(id, user.id, data);
    },
    onSuccess: (_, { id, data }) => {
      formLogger.debug("Assignment updated successfully", { id });
      queryClient.setQueryData(
        ASSIGNMENT_KEYS.detail(id),
        (old: AssignmentFormValues) => ({
          ...(old as AssignmentFormValues),
          ...data,
          updated_at: new Date().toISOString(),
        })
      );
    },
    onError: (error) => {
      formLogger.error("Failed to update assignment", { error });
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

      // Skip fetching if we already have form data
      const formId = form.getValues().id;
      if (formId && formId === assignmentId) {
        formLogger.debug("Skipping fetch - already have matching form ID", {
          formId,
        });
        return null;
      }

      // Fetch assignment data
      return fetchAssignmentData();
    },
    // Only fetch if we don't already have the data or it's a new assignment that needs creation
    enabled:
      !createMutation.isSuccess &&
      (isNewAssignment ||
        !form.getValues().id ||
        form.getValues().id !== assignmentId),
    // Prevent auto-refetching which can cause multiple creations
    refetchOnWindowFocus: false,
    retry: isNewAssignment ? 0 : 3, // Don't retry for new assignments
    refetchOnMount: true, // Force refetch on mount
  });

  // ===== Auto-Save Logic =====

  // Save form data
  const saveData = useCallback(
    async (id: string, data: AssignmentFormValues) => {
      if (updateMutation.isPending) return;

      formLogger.debug("Performing save", { id });
      const { files, ...dataWithoutFiles } = data;
      await updateMutation.mutateAsync({ id, data: dataWithoutFiles });
    },
    [updateMutation]
  );

  // Debounced auto-save function
  const debouncedAutoSave = useCallback(
    (id: string, data: AssignmentFormValues) => {
      if (autoSaveTimeout) clearTimeout(autoSaveTimeout);

      const timeout = setTimeout(() => {
        formLogger.debug("Executing debounced auto-save", { id });
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

      if (formId && isEditable && isDirty) {
        formLogger.debug("Form data changed, triggering auto-save", {
          id: formId,
          status: data.status,
        });
        debouncedAutoSave(formId, data);
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
    formLogger.info("Validating entire assignment", { id: data.id });
    const isValid = await form.trigger();

    if (!isValid) {
      handleValidationErrors();
      return;
    }

    // Submit the assignment
    formLogger.info("Submitting assignment", { id: data.id });
    await updateMutation.mutateAsync({
      id: data.id,
      data: {
        status: ASSIGNMENT_STATUS.SUBMITTED,
        submitted_at: new Date().toISOString(),
      },
    });

    window.location.reload();
    toast.success("Assignment submitted successfully");
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
  const isContinueDisabled = useMemo(() => {
    console.log(["DEBUG 1st tab must be completed"], {
      isLoading,
      isEditable: steps.isEditable(form.getValues().status),
      isBasicInfoComplete: isBasicInfoComplete(form.getValues()),
      status: form.getValues().status,
      formValues: form.getValues(),
      result:
        isLoading ||
        !steps.isEditable(form.getValues().status) ||
        !isBasicInfoComplete(form.getValues()),
    });
    return (
      isLoading ||
      !steps.isEditable(form.getValues().status) ||
      !isBasicInfoComplete(form.getValues())
    );
  }, [isLoading, form.watch()]);

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
  };
}

export { useAssignmentForm };