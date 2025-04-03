import { useAssignmentForm } from "@/hooks/useAssignmentForm";
import { STEPS } from "@/lib/config/steps";
import { Form } from "@/components/ui/form";
import { User } from "@supabase/supabase-js";
import { useState, useCallback, useEffect } from "react";
import {
  StepContent,
  StepProgress,
  StepHeader,
  ConfirmationModal,
} from "@/components/assignment";
import { type AssignmentStep } from "@/types/assignment";
import { ASSIGNMENT_STATUS, type AssignmentStatus, type LockedForContinueStatus } from "@/constants/assignment-status";

type AssignmentFormProps = {
  user: User;
};

function AssignmentForm({ user }: AssignmentFormProps) {
  const {
    form,
    currentStep,
    setCurrentStep,
    handleSaveAndContinue,
    previousStep,
    isCurrentStepComplete,
    isCurrentStepEditable,
    validateStep,
    isLoading,
  } = useAssignmentForm({ user });

  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const currentStepConfig = STEPS.find((step) => step.id === currentStep);
  const assignmentStatus: AssignmentStatus = form.getValues().status || ASSIGNMENT_STATUS.DRAFT;

  useEffect(() => {
    const lockedStatuses: LockedForContinueStatus[] = [
      ASSIGNMENT_STATUS.SUBMITTED,
    ];
    if (
      lockedStatuses.includes(assignmentStatus as LockedForContinueStatus) &&
      currentStep !== "teacher-feedback"
    ) {
      setCurrentStep("teacher-feedback");
    }
  }, [assignmentStatus, currentStep, setCurrentStep]);

  const handleSaveAndContinueClick = useCallback(() => {
    if (currentStep === "review-submit" && isCurrentStepComplete()) {
      setShowConfirmationModal(true);
    }else{
      handleSaveAndContinue();
    }
  }, [currentStep, isCurrentStepComplete, handleSaveAndContinue]);

  const handleConfirmSubmit = useCallback(() => {
    handleSaveAndContinue();
    setShowConfirmationModal(false);
  }, [handleSaveAndContinue]);

  const handleSetCurrentStep = useCallback(
    (stepId: string) => {
      if (STEPS.some(step => step.id === stepId)) {
        setCurrentStep(stepId as AssignmentStep);
      }
    },
    [setCurrentStep]
  );

  if (!currentStepConfig) return null;

  const isContinueDisabled = isLoading || !isCurrentStepComplete() || !isCurrentStepEditable();
  const lockedStatuses: LockedForContinueStatus[] = [
    ASSIGNMENT_STATUS.SUBMITTED,
  ];

  return (
    <div className="flex flex-col gap-4 md:gap-8 container my-4 md:my-10">
      <div className="w-full md:hidden">
        <StepProgress 
          steps={STEPS}
          currentStep={currentStep}
          setCurrentStep={handleSetCurrentStep}
          validateStep={validateStep}
          status={assignmentStatus}
        />
      </div>

      <div className="flex flex-col md:flex-row md:gap-8">
        <div className="hidden md:block w-80 h-max border-2 border-slate-200 rounded-md">
          <StepProgress 
            steps={STEPS}
            currentStep={currentStep}
            setCurrentStep={handleSetCurrentStep}
            validateStep={validateStep}
            status={assignmentStatus}
          />
        </div>

        <div className="flex-1">
          <Form {...form}>
            <div className="rounded-md border border-gray-200 flex flex-col h-[calc(100vh-8rem)] overflow-hidden">
              <StepHeader
                title={currentStepConfig.header}
                description={currentStepConfig.description}
                showContinueButton={
                  currentStep !== "teacher-feedback" && 
                  !lockedStatuses.includes(assignmentStatus as LockedForContinueStatus)
                }
                onContinue={handleSaveAndContinueClick}
                disabled={isContinueDisabled}
              />
              <section className="py-6 md:py-10 px-4 md:px-6 flex-1 overflow-y-auto">
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
  );
}

export default AssignmentForm;