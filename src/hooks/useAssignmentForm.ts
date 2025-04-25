import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { assignmentFormSchema, baseAssignmentFormSchema, type AssignmentFormValues } from "@/lib/validations/assignment";
import { type AssignmentStep } from "@/types/assignment";
import { ASSIGNMENT_STATUS } from "@/constants/assignment-status";
import { STEPS } from "@/lib/config/steps";
import { ToastService } from "@/lib/services/toast.service";
import { StepService } from "@/lib/services/step.service";
import { getDefaultValues } from "@/lib/services/assignment-defaults.service";
import { ROUTES } from "@/config/routes";
import { logger } from "@/lib/logger";
import { createAssignment, updateAssignment, deleteAssignment, getAssignmentWithFiles } from "@/api/assignment";

const AUTO_SAVE_DELAY = 5000;
const toast = new ToastService();
const steps = new StepService(STEPS);
const formLogger = logger.forModule("useAssignmentForm");

function useAssignmentForm({ user }: { user: User }) {
  const { id: assignmentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form setup
  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: getDefaultValues(),
    mode:"onBlur"
  });

  // State
  const [currentStep, setCurrentStep] = useState<AssignmentStep>("basic-info");
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Data operations
  const createMutation = useMutation({
    mutationFn: (data: Omit<AssignmentFormValues, "id">) => {
      formLogger.info("Creating new assignment", { studentId: user.id });
      return createAssignment(data);
    },
    onSuccess: (response) => {
      if (response?.id) {
        formLogger.info("Assignment created successfully", { assignmentId: response.id });
        form.reset(baseAssignmentFormSchema.parse({ ...getDefaultValues(), ...response, id: response.id }), { keepDirty: true });
        queryClient.setQueryData(["assignment", response.id], response);
        navigate(ROUTES.STUDENT.MANAGE_ASSIGNMENT.replace(":id", response.id), { replace: true });
      }
    },
    onError: (error) => {
      formLogger.error("Failed to create assignment", { error });
      toast.error(`Failed to create assignment: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AssignmentFormValues> }) => {
      formLogger.debug("Updating assignment", { id, fields: Object.keys(data) });
      return updateAssignment(id, user.id, data);
    },
    onSuccess: (_, { id, data }) => {
      formLogger.debug("Assignment updated successfully", { id });
      queryClient.setQueryData(["assignment", id], (old:AssignmentFormValues) => ({
        ...old as AssignmentFormValues,
        ...data,
        updated_at: new Date().toISOString(),
      }));
    },
    onError: (error) => {
      formLogger.error("Failed to update assignment", { error });
      toast.error(`Failed to update assignment: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      formLogger.info("Deleting assignment", { id });
      return deleteAssignment(id, user.id);
    },
    onSuccess: () => {
      formLogger.info("Assignment deleted successfully", { id: assignmentId });
      queryClient.removeQueries({ queryKey: ["assignment", assignmentId] });
      navigate(ROUTES.STUDENT.DASHBOARD);
      toast.success("Assignment deleted successfully");
    },
    onError: (error) => {
      formLogger.error("Failed to delete assignment", { id: assignmentId, error });
      toast.error(`Failed to delete assignment: ${error.message}`);
    },
  });

  // Fetch or create assignment
  const { isLoading: isDataLoading } = useQuery({
    queryKey: ["assignment", assignmentId],
    queryFn: async () => {

      // Need to create a new assignment if we don't have an assignment ID
      if (assignmentId === ":id") {
        formLogger.info("Initializing new assignment", { userId: user.id });
        const initialData = { ...getDefaultValues(), student_id: user.id, status: ASSIGNMENT_STATUS.DRAFT };
        createMutation.mutate(initialData);
        return null;
      }
      
      // Skip fetching if we already have a form ID (prevents loading on navigation)
      if (form.getValues().id) {
        formLogger.debug("Skipping fetch - already have form ID", { formId: form.getValues().id });
        return null;
      }
      
      formLogger.debug("Fetching assignment data", { assignmentId });

      try {

        const response = await getAssignmentWithFiles(assignmentId, user.id);

        if (response) {
          // Need to type check that response has id property
          if (typeof response === 'object' && response !== null && 'id' in response) {
            formLogger.debug("Assignment fetched successfully", { id: response.id, response });
            form.reset(baseAssignmentFormSchema.parse(response as AssignmentFormValues), { keepDirty: true });
            setCurrentStep(steps.getNextIncompleteStep(response as AssignmentFormValues));
          } else {
            formLogger.warn("Response missing ID field", { response });
          }
          return null;
        } else {
          formLogger.warn("Invalid assignment response", { assignmentId });
          throw new Error("Invalid assignment response");
        }
      } catch (error) {
        formLogger.error("Error fetching assignment", { assignmentId, error });
        toast.error(`Error loading assignment: ${error.message}`);
        throw error;
      }
    },
    // Disable fetching if we already have the data in the form
    enabled: !(form.getValues().id && form.getValues().id !== ":id"),
  });

  // Auto-save logic
  const saveData = useCallback(
    async (id: string, data: AssignmentFormValues) => {
      if (updateMutation.isPending) return;
      formLogger.debug("Performing auto-save", { id });
      const { files, ...dataWithoutFiles } = data;
      await updateMutation.mutateAsync({ id, data: dataWithoutFiles });
    },
    [updateMutation],
  );

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
    [autoSaveTimeout, saveData, form],
  );

  useEffect(() => {
    formLogger.debug("Setting up form change subscription", { assignmentId });
    const subscription = form.watch((data) => {
      if (data?.id && steps.isEditable(data.status) && Object.keys(form.formState.dirtyFields).length > 0) {
        formLogger.debug("Form data changed, triggering auto-save", {
          id: data.id,
          status: data.status,
        });
        debouncedAutoSave(data.id, data);
      }
    });
    return () => {
      formLogger.debug("Cleaning up form watch subscription");
      subscription.unsubscribe();
      if (autoSaveTimeout) {
        formLogger.debug("Performing final save on unmount");
        clearTimeout(autoSaveTimeout);
        saveData(form.getValues().id, form.getValues()).catch((error) => {
          formLogger.error("Final save failed", { error });
          toast.error("Final save failed");
        });
      }
    };
  }, [form, debouncedAutoSave, autoSaveTimeout, saveData, assignmentId]);

  // Effect to reset query cache when we get a form ID
  useEffect(() => {
    const formId = form.getValues().id;
    
    // If we have a valid form ID but queries are still loading,
    // cancel any ongoing queries to stop loading state
    if (formId && isDataLoading) {
      formLogger.debug("Form has ID but still loading, canceling queries", { formId });
      queryClient.cancelQueries({ queryKey: ["assignment", assignmentId] });
      
      // If we navigate to a new ID, we should invalidate the current query
      if (assignmentId && assignmentId !== ":id" && assignmentId !== formId) {
        formLogger.debug("Assignment ID changed, invalidating queries", { 
          formId, 
          assignmentId 
        });
        queryClient.invalidateQueries({ queryKey: ["assignment", assignmentId] });
      }
    }
  }, [form, assignmentId, isDataLoading, queryClient]);

  useEffect(() => {
    formLogger.debug("Revalidating all queries", { assignmentId });
    queryClient.invalidateQueries({
      queryKey: ["assignment", assignmentId],
      refetchType: 'all'
    });
  }, []);

  // Step navigation and validation
  const validateStep = useCallback(
    (stepId: AssignmentStep) => {
      const isValid = steps.validateStep(stepId, form.getValues());
      formLogger.debug("Validating step", { step: stepId, isValid });
      return isValid;
    },
    [form],
  );

  const isCurrentStepComplete = useCallback(() => {
    const isComplete = validateStep(currentStep);
    formLogger.debug("Checking step completion", { step: currentStep, isComplete });
    return isComplete;
  }, [currentStep, validateStep]);

  const handleSaveAndContinue = useCallback(async () => {
    formLogger.info("Save and continue initiated", { currentStep });
    await form.trigger();
    if (!isCurrentStepComplete()) {
      formLogger.warn("Save and continue blocked - current step incomplete", { step: currentStep });
      toast.error("Please complete all required fields");
      return;
    }
    const data = form.getValues();
    if (!data.id) {
      formLogger.error("Save and continue attempted without assignment ID");
      return;
    }

    if (currentStep === "review-submit") {
      formLogger.info("Submitting assignment", { id: data.id });
      await updateMutation.mutateAsync({
        id: data.id,
        data: { status: ASSIGNMENT_STATUS.SUBMITTED, submitted_at: new Date().toISOString() },
      });
      setCurrentStep("teacher-feedback");
      toast.success("Assignment submitted successfully");
    } else {
      formLogger.debug("Saving and advancing to next step", { currentStep });
      await saveData(data.id, data);
      const next = steps.getNextStep(currentStep, data);
      if (next) {
        formLogger.info("Advancing to next step", { from: currentStep, to: next });
        setCurrentStep(next);
        toast.success("Saved and continued");
      }
    }
  }, [form, currentStep, saveData, updateMutation, isCurrentStepComplete]);

  const previousStep = useCallback(() => {
    const prev = steps.getPreviousStep(currentStep, form.getValues());
    if (prev) {
      formLogger.info("Navigating to previous step", { from: currentStep, to: prev });
      setCurrentStep(prev);
    } else {
      formLogger.warn("Cannot navigate to previous step", { currentStep });
    }
  }, [currentStep, form]);

  const handleDeleteAssignment = useCallback(() => {
    const id = form.getValues("id");
    if (id) {
      formLogger.info("Initiating assignment deletion", { id });
      deleteMutation.mutate(id);
    } else {
      formLogger.warn("Delete attempted without assignment ID");
    }
  }, [form, deleteMutation]);

  // Derived states
  const isLoading = Boolean(
    // If we have a valid ID in the form, don't show loading
    !form.getValues().id ? 
    // Otherwise, check all loading states
    (isDataLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending)
    : false
  );
  const isContinueDisabled = useMemo(() => {
    return isLoading || !isCurrentStepComplete() || !steps.isEditable(form.getValues().status);
  }, [isLoading, isCurrentStepComplete, form.formState, form]);

  return {
    form,
    currentStep,
    setCurrentStep,
    handleSaveAndContinue,
    previousStep,
    isCurrentStepComplete,
    validateStep,
    isLoading,
    isEditing: !!assignmentId && assignmentId !== ":id",
    handleDeleteAssignment,
    isContinueDisabled,
  };
}

export { useAssignmentForm };