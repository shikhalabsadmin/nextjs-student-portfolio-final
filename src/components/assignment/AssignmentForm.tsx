import { useState, useCallback, useMemo } from "react";
import { User } from "@supabase/supabase-js";
import { Form } from "@/components/ui/form";
import { Loading } from "@/components/ui/loading";
import {
  StepContent,
  StepProgress,
  StepHeader,
  ConfirmationModal,
} from "@/components/assignment";
import { useAssignmentForm } from "@/hooks/useAssignmentForm";
import { STEPS } from "@/lib/config/steps";
import { type AssignmentStep } from "@/types/assignment";
import {
  ASSIGNMENT_STATUS,
  type LockedForContinueStatus,
  type AssignmentStatus,
} from "@/constants/assignment-status";
import { GenericBreadcrumb } from "./AssignmentBreadcrumb";
import { ROUTES } from "@/config/routes";

type AssignmentFormProps = {
  user: User;
};

function AssignmentForm({ user }: AssignmentFormProps) {
  // State management
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  // Form and assignment state from custom hook
  const {
    form,
    currentStep,
    setCurrentStep,
    handleSaveAndContinue,
    isCurrentStepComplete,
    validateStep,
    isLoading,
    isContinueDisabled,
  } = useAssignmentForm({ user });

  // Derived state
  const assignmentStatus = form.getValues().status || ASSIGNMENT_STATUS.DRAFT;

  const lockedStatuses = useMemo<LockedForContinueStatus[]>(
    () => [ASSIGNMENT_STATUS.SUBMITTED, ASSIGNMENT_STATUS.NEEDS_REVISION],
    []
  );

  const currentStepConfig = useMemo(
    () => STEPS.find((step) => step.id === currentStep),
    [currentStep]
  );

  const filteredSteps = useMemo(
    () => {
      if (assignmentStatus === ASSIGNMENT_STATUS.DRAFT) {
        // For DRAFT status, show all steps except "teacher-feedback"
        return STEPS.filter((step) => step.id !== "teacher-feedback");
      } else if (
        lockedStatuses.includes(assignmentStatus as LockedForContinueStatus)
      ) {
        // For SUBMITTED or NEEDS_REVISION, show only "teacher-feedback"
        setCurrentStep("teacher-feedback");
        return STEPS.filter((step) => step.id === "teacher-feedback");
      } else {
        // For other statuses (e.g., APPROVED), show all steps
        return STEPS;
      }
    },
    [assignmentStatus, lockedStatuses, setCurrentStep]
  );

  // Event handlers
  const handleSetCurrentStep = useCallback(
    (stepId: string) => {
      if (STEPS.some((step) => step.id === stepId)) {
        setCurrentStep(stepId as AssignmentStep);
      }
    },
    [setCurrentStep]
  );

  const handleSaveAndContinueClick = useCallback(() => {
    if (currentStep === "review-submit" && isCurrentStepComplete()) {
      setShowConfirmationModal(true);
      return;
    }
    handleSaveAndContinue();
  }, [currentStep, isCurrentStepComplete, handleSaveAndContinue]);

  const handleConfirmSubmit = useCallback(() => {
    handleSaveAndContinue();
    setShowConfirmationModal(false);
  }, [handleSaveAndContinue]);

  // Shared props
  const stepProgressProps = {
    steps: filteredSteps,
    currentStep,
    setCurrentStep: handleSetCurrentStep,
    validateStep,
    status: assignmentStatus as AssignmentStatus,
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-1 min-h-screen items-center justify-center">
        <Loading text="Loading assignment..." />
      </div>
    );
  }

  // Main render
  return (
    <div className="px-16 py-6 flex flex-col gap-6">
      {/* Breadcrumb navigation - full width */}
      <GenericBreadcrumb
        items={[
          { label: "Dashboard", to: ROUTES.STUDENT.DASHBOARD },
          { label: "New Artefact", to: "" },
          {
            label: assignmentStatus
              ? `${assignmentStatus.charAt(0).toUpperCase()}${assignmentStatus
                  .slice(1)
                  .toLowerCase()}`
              : "Something went wrong",
            isCurrent: true,
          },
        ]}
        hasBackIcon={true}
        backTo={ROUTES.STUDENT.DASHBOARD}
        styles={{
          container: "!w-full !max-w-none !px-0",
        }}
      />

      <div className="flex flex-col gap-4">
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
                <StepHeader
                  title={currentStepConfig?.header ?? ""}
                  description={currentStepConfig?.description ?? ""}
                  onContinue={handleSaveAndContinueClick}
                  disabled={isContinueDisabled}
                  step={currentStep as AssignmentStep}
                />
                <section className="px-3 py-2 md:px-6 md:py-4 flex-1 overflow-y-auto">
                  <StepContent step={currentStep} form={form} />
                </section>
              </div>
            </Form>

            <ConfirmationModal
              open={showConfirmationModal}
              onOpenChange={setShowConfirmationModal}
              onConfirm={handleConfirmSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssignmentForm;
