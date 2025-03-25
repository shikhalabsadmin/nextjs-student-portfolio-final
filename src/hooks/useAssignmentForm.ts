import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { type AssignmentFormValues, assignmentFormSchema, baseAssignmentFormSchema } from "@/lib/validations/assignment";
import { type AssignmentStep } from "@/types/assignment";
import { ASSIGNMENT_STATUS } from "@/constants/assignment-status";
import { STEPS } from "@/lib/config/steps";
import { getAssignmentFiles } from "@/lib/services/file-upload.service";
import { debug } from "@/lib/utils/debug.service";
import { ToastService } from "@/lib/services/toast.service";
import { AssignmentService } from "@/lib/services/assignment.service";
import { StepService } from "@/lib/services/step.service";
import { getDefaultValues } from "@/lib/services/assignment-defaults.service";

export function useAssignmentForm({ user }: { user: User }) {
  const { id: assignmentId } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const toast = useMemo(() => new ToastService(), []);
  const assignments = useMemo(() => new AssignmentService(toast, navigate, user.id), [toast, navigate, user.id]);
  const steps = useMemo(() => new StepService(STEPS), []);

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: getDefaultValues(),
    mode: "onChange",
  });

  const [currentStep, setCurrentStepState] = useState<AssignmentStep>("basic-info");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const grade = user.user_metadata?.grade as string | undefined;
    if (grade) form.setValue("grade", grade, { shouldValidate: true });
  }, [form, user.user_metadata?.grade]);

  const fetchFiles = useCallback(async (id: string) => {
    try {
      const files = await getAssignmentFiles(id);
      form.setValue("files", files, { shouldValidate: true });
    } catch (error) {
      debug.error("File fetch failed", error);
      form.setValue("files", [], { shouldValidate: true });
      toast.error("Failed to load files");
    }
  }, [form, toast]);

  const loadAssignment = useCallback(async () => {
    if (!user.id) {
      toast.error("User not authenticated");
      navigate("/login");
      return;
    }

    setIsLoading(true);
    try {
      const data = await assignments.initialize(assignmentId);
      if (!data) {
        if (assignmentId) {
          toast.error("Assignment not found");
          navigate("/assignments");
        }
        return;
      }

      form.reset(baseAssignmentFormSchema.parse(data), { keepDirty: false });
      STEPS.forEach(step => steps.markStepVisited(step.id));
      if (data.id) await fetchFiles(data.id);
      if (data.status === ASSIGNMENT_STATUS.SUBMITTED || data.status === ASSIGNMENT_STATUS.UNDER_REVIEW) {
        setCurrentStepState('teacher-feedback');
      }
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId, assignments, fetchFiles, form, steps, toast, navigate, user.id]);

  useEffect(() => {
    loadAssignment();
  }, [loadAssignment]);

  useEffect(() => {
    const subscription = form.watch((data) => {
      if (!data?.id || isLoading || !steps.isStepEditable(currentStep, data)) return;
      assignments.autoSave(data.id, data).catch(error => 
        toast.error("Auto-save failed: " + (error instanceof Error ? error.message : "Unknown error"))
      );
    });
    return () => {
      subscription.unsubscribe();
      assignments.cleanup();
    };
  }, [form, assignments, toast, isLoading, currentStep, steps]);

  const isCurrentStepComplete = useCallback(() => {
    const data = form.getValues();
    return currentStep === 'review-submit'
      ? STEPS.every(step => step.id === 'teacher-feedback' || steps.validateStep(step.id, data))
      : steps.validateStep(currentStep, data);
  }, [currentStep, form, steps]);

  const isCurrentStepEditable = useCallback(() => 
    steps.isStepEditable(currentStep, form.getValues()), 
  [currentStep, form, steps]);

  const validateStep = useCallback(
    (stepId: AssignmentStep) => steps.validateStep(stepId, form.getValues()),
    [form, steps]
  );

  const setCurrentStep = useCallback((step: AssignmentStep) => {
    const data = form.getValues();
    if (steps.canNavigateToStep(step, currentStep, data)) {
      setCurrentStepState(step);
      debug.log(`Navigated to step: ${step}`);
    } else {
      toast.error(`Cannot navigate to '${step}' until all previous steps are complete`);
      debug.warn(`Navigation to ${step} blocked from ${currentStep}`);
    }
  }, [currentStep, form, steps, toast]);

  const handleSaveAndContinue = useCallback(async () => {
    const data = form.getValues();
    const allPreviousStepsComplete = STEPS
      .slice(0, STEPS.findIndex(step => step.id === currentStep) + 1)
      .every(step => steps.validateStep(step.id, data));

    if (!allPreviousStepsComplete) {
      const invalidSteps = STEPS
        .slice(0, STEPS.findIndex(step => step.id === currentStep) + 1)
        .filter(step => !steps.validateStep(step.id, data))
        .map(step => `'${step.id}'`)
        .join(", ");
      toast.error(`Please complete: ${invalidSteps}`);
      return;
    }

    setIsLoading(true);
    try {
      if (currentStep === "review-submit") {
        form.setValue("status", ASSIGNMENT_STATUS.SUBMITTED, { shouldValidate: true });
        await assignments.submit({ ...data, status: ASSIGNMENT_STATUS.SUBMITTED });
        setCurrentStepState('teacher-feedback');
        toast.success("Assignment submitted successfully");
      } else {
        if (data.id) await assignments.autoSave(data.id, data);
        const next = steps.getNext(currentStep, data);
        if (next) {
          steps.markStepVisited(next);
          setCurrentStepState(next);
          toast.success("Saved and continued");
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentStep, form, steps, assignments, toast]);

  const previousStep = useCallback(() => {
    const data = form.getValues();
    const prev = steps.getPrevious(currentStep, data);
    if (prev) {
      setCurrentStepState(prev);
      debug.log(`Moved to previous step: ${prev}`);
    } else {
      toast.error("Cannot move back until previous steps are complete");
    }
  }, [currentStep, steps, toast]);

  return {
    form,
    currentStep,
    setCurrentStep,
    handleSaveAndContinue,
    previousStep,
    isCurrentStepComplete,
    isCurrentStepEditable,
    validateStep,
    isLoading,
  };
}