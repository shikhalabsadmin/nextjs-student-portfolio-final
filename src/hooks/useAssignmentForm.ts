import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import {
  assignmentFormSchema,
  type AssignmentFormValues,
  baseAssignmentFormSchema,
} from "@/lib/validations/assignment";
import { type AssignmentStep } from "@/types/assignment";
import { AssignmentStatus } from "@/types/assignment-status";
import { STEPS } from "@/lib/config/steps";
import { getAssignmentFiles } from "@/lib/services/file-upload.service";
import { debug } from "@/lib/utils/debug.service";
import { ToastService } from "@/lib/services/toast.service";
import { AssignmentService } from "@/lib/services/assignment.service";
import { StepService } from "@/lib/services/step.service";
import { getDefaultValues } from "@/lib/services/assignment-defaults.service";

// Manages a multi-step assignment form with validation and auto-save
export function useAssignmentForm({ user }: { user: User }) {
  const { id: assignmentId } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<AssignmentStep>("basic-info");
  const [isLoading, setIsLoading] = useState(false);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  // Memoized service instances
  const toast = useMemo(() => new ToastService(), []);
  const assignments = useMemo(() => new AssignmentService(toast, navigate, user.id), [toast, navigate, user.id]);
  const steps = useMemo(() => new StepService(), []);

  // Form configuration with strict Zod validation
  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: getDefaultValues(),
    mode: "onChange",
  });

  // Syncs user grade from metadata once on mount
  useEffect(() => {
    const grade = user.user_metadata?.grade as string;
    if (grade) form.setValue("grade", grade);
  }, []);

  // Fetches and sets assignment files
  const fetchFiles = useCallback(async (id: string) => {
    try {
      form.setValue("files", await getAssignmentFiles(id));
    } catch (error) {
      debug.error("File fetch failed", error);
      form.setValue("files", []);
      toast.error("Failed to load files");
    }
  }, [form, toast]);

  // Loads and initializes assignment data
  const loadAssignment = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await assignments.initialize(assignmentId);
      if (data) {
        const parsedData = baseAssignmentFormSchema.parse(data);
        form.reset(parsedData);
        STEPS.forEach(step => steps.markStepVisited(step.id));
        if (data.id) await fetchFiles(data.id);
      } else if (assignmentId) {
        toast.error("Assignment not found");
      }
    } catch (error) {
      debug.error("Assignment load failed", error);
      toast.error("Failed to load assignment");
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId, assignments, fetchFiles, form, steps, toast]);

  useEffect(() => { loadAssignment(); }, [loadAssignment]);

  // Auto-saves form data with 1-second debounce
  useEffect(() => {
    const subscription = form.watch((data) => {
      if (!data?.id) return;
      if (timeoutId.current) clearTimeout(timeoutId.current);
      timeoutId.current = setTimeout(() => {
        assignments.autoSave(data.id!, data).catch(error => {
          debug.error("Auto-save failed", error);
          toast.error("Failed to save changes");
        });
      }, 5000);
    });
    return () => {
      if (timeoutId.current) clearTimeout(timeoutId.current);
      subscription.unsubscribe();
    };
  }, [form, assignments, toast]);

  // Validates and navigates to target step
  const validateAndNavigate = useCallback((target: AssignmentStep, data: AssignmentFormValues) => {
    if (steps.canNavigateToStep(target, currentStep, data)) {
      steps.markStepVisited(target);
      setCurrentStep(target);
    } else {
      toast.error("Please complete all required fields");
    }
  }, [currentStep, steps, toast]);

  // Advances to next step if valid
  const nextStep = useCallback(() => {
    const data = form.getValues();
    const next = steps.getNext(currentStep, data);
    if (next) validateAndNavigate(next, data);
  }, [currentStep, form, steps, validateAndNavigate]);

  // Returns to previous step if available
  const previousStep = useCallback(() => {
    const prev = steps.getPrevious(currentStep);
    if (prev) setCurrentStep(prev);
  }, [currentStep, steps]);

  // Checks if current step is complete
  const isStepComplete = useCallback(() => {
    const data = form.getValues();
    steps.markStepVisited(currentStep);
    return steps.validateStep(currentStep, data);
  }, [currentStep, form, steps]);

  // Handles form submission with strict validation
  const handleSubmit = useCallback(async (data: AssignmentFormValues) => {
    setIsLoading(true);
    try {
      const isFinal = currentStep === "review-submit" || data.status === AssignmentStatus.SUBMITTED;
      if (isFinal || STEPS.every(step => steps.validateStep(step.id, data))) {
        if (isFinal) {
          const finalData = { ...data, status: AssignmentStatus.SUBMITTED };
          form.setValue("status", AssignmentStatus.SUBMITTED);
          await assignments.submit(finalData);
        } else {
          await assignments.submit(data);
        }
      } else {
        const invalidSteps = STEPS.filter(step => !steps.validateStep(step.id, data))
          .map(step => step.id);
        toast.error(`Please complete required fields in: ${invalidSteps.join(", ")}`);
      }
    } catch (error) {
      debug.error("Submission failed", error);
      toast.error("Failed to submit assignment");
    } finally {
      setIsLoading(false);
    }
  }, [currentStep, form, assignments, steps, toast]);

  return {
    form,
    currentStep,
    setCurrentStep: (step: AssignmentStep) => validateAndNavigate(step, form.getValues()),
    nextStep,
    previousStep,
    isCurrentStepComplete: isStepComplete,
    validateStep: steps.validateStep.bind(steps),
    onSubmit: form.handleSubmit(handleSubmit),
    isLoading,
  };
}