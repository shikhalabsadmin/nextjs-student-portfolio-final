import { useAssignmentForm } from "@/hooks/useAssignmentForm";
import { STEPS } from "@/lib/config/steps";
import { Form } from "@/components/ui/form";
import { User } from "@supabase/supabase-js";
import { useState, useCallback, useMemo } from "react";
import {
  StepContent,
  StepProgress,
  StepHeader,
  ConfirmationModal,
} from "@/components/assignment";
import { type AssignmentStep } from "@/types/assignment";
import {
  ASSIGNMENT_STATUS,
  type LockedForContinueStatus,
  type AssignmentStatus
} from "@/constants/assignment-status";
import { Loading } from "@/components/ui/loading";

type AssignmentFormProps = { user: User };

function AssignmentForm({ user }: AssignmentFormProps) {
  // Form state and handlers from custom hook
  const {
    form,
    currentStep,
    setCurrentStep,
    handleSaveAndContinue,
    isCurrentStepComplete,
    isCurrentStepEditable,
    validateStep,
    isLoading,
  } = useAssignmentForm({ user });

  // Modal visibility state
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  // Constant locked statuses for submission
  const lockedStatuses = useMemo<LockedForContinueStatus[]>(
    () => [ASSIGNMENT_STATUS.SUBMITTED, ASSIGNMENT_STATUS.NEEDS_REVISION],
    []
  );

  // Current assignment status with fallback
  const assignmentStatus = form.getValues().status || ASSIGNMENT_STATUS.DRAFT;

  // Current step configuration
  const currentStepConfig = useMemo(
    () => STEPS.find((step) => step.id === currentStep),
    [currentStep]
  );

  // Filtered steps based on assignment status
  const filteredSteps = useMemo(
    () =>
      lockedStatuses.includes(assignmentStatus as LockedForContinueStatus)
        ? (setCurrentStep("teacher-feedback"),
          STEPS.filter((step) => step.id === "teacher-feedback"))
        : STEPS,
    [lockedStatuses, assignmentStatus, setCurrentStep]
  );

  // Continue button disabled state
  const isContinueDisabled = useMemo(
    () => isLoading || !isCurrentStepComplete() || !isCurrentStepEditable(),
    [isLoading, isCurrentStepComplete, isCurrentStepEditable]
  );

  const showContinueButton = useMemo(() => {
    return (
      currentStep !== "teacher-feedback" &&
      !lockedStatuses.includes(assignmentStatus as LockedForContinueStatus)
    );
  }, [currentStep, lockedStatuses, assignmentStatus]);

  // Handle step navigation
  const handleSetCurrentStep = useCallback(
    (stepId: string) => {
      if (STEPS.some((step) => step.id === stepId)) {
        setCurrentStep(stepId as AssignmentStep);
      }
    },
    [setCurrentStep]
  );

  // Handle save and continue with confirmation for final step
  const handleSaveAndContinueClick = useCallback(() => {
    if (currentStep === "review-submit" && isCurrentStepComplete()) {
      setShowConfirmationModal(true);
      return;
    }
    handleSaveAndContinue();
  }, [currentStep, isCurrentStepComplete, handleSaveAndContinue]);

  // Handle final submission confirmation
  const handleConfirmSubmit = useCallback(() => {
    handleSaveAndContinue();
    setShowConfirmationModal(false);
  }, [handleSaveAndContinue]);

  // Shared props for StepProgress components
  const stepProgressProps = {
    steps: filteredSteps,
    currentStep,
    setCurrentStep: handleSetCurrentStep,
    validateStep,
    status: assignmentStatus as AssignmentStatus,
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 min-h-screen items-center justify-center">
        <Loading text="Loading assignment..." />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4 md:gap-8 container my-4 md:my-10">
      {/* Mobile step progress */}
      <div className="w-full md:hidden">
        <StepProgress {...stepProgressProps} />
      </div>

      <div className="flex flex-col md:flex-row md:gap-8">
        {/* Desktop step progress sidebar */}
        <div className="hidden md:block w-80 h-max border-2 border-slate-200 rounded-md">
          <StepProgress {...stepProgressProps} />
        </div>

        {/* Main form content */}
        <div className="flex-1">
          <Form {...form}>
            <div className="rounded-md border border-gray-200 flex flex-col h-[calc(100vh-8rem)] overflow-hidden">
              {/* Step header with navigation */}
              <StepHeader
                title={currentStepConfig?.header ?? ""}
                description={currentStepConfig?.description ?? ""}
                showContinueButton={showContinueButton}
                onContinue={handleSaveAndContinueClick}
                disabled={isContinueDisabled}
              />
              {/* Dynamic step content */}
              <section className="px-3 py-2 md:px-6 md:py-4 flex-1 overflow-y-auto">
                <StepContent step={currentStep} form={form} />
              </section>
            </div>
          </Form>

          {/* Submission confirmation modal */}
          <ConfirmationModal
            open={showConfirmationModal}
            onOpenChange={setShowConfirmationModal}
            onConfirm={handleConfirmSubmit}
          />
        </div>
      </div>
    </div>
  );
}

export default AssignmentForm;
