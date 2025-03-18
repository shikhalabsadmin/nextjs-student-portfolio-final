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
import { AssignmentStatus } from "@/types/assignment-status";

type AssignmentFormProps = {
  user: User;
};

function AssignmentForm({ user }: AssignmentFormProps) {
  const {
    form,
    currentStep,
    setCurrentStep,
    nextStep,
    onSubmit,
    isLoading,
    isCurrentStepComplete,
    validateStep,
  } = useAssignmentForm({ user });

  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const currentStepConfig = STEPS.find((step) => step.id === currentStep);
  
  // Get current assignment status from form values
  const assignmentStatus = form.getValues().status || AssignmentStatus.DRAFT;
  
  // Force navigation to teacher-feedback when status is SUBMITTED or VERIFIED
  useEffect(() => {
    if (
      (assignmentStatus === AssignmentStatus.SUBMITTED || 
       assignmentStatus === AssignmentStatus.VERIFIED) && 
      currentStep !== "teacher-feedback"
    ) {
      setCurrentStep("teacher-feedback");
    }
  }, [assignmentStatus, currentStep, setCurrentStep]);

  const handleSaveAndContinue = useCallback(() => {
    if (!isCurrentStepComplete()) return;

    if (currentStep === "review-submit") {
      setShowConfirmationModal(true);
      return;
    }

    onSubmit();
    nextStep();
  }, [currentStep, isCurrentStepComplete, onSubmit, nextStep]);

  const handleConfirmSubmit = useCallback(() => {
    // Set status to SUBMITTED first
    form.setValue("status", AssignmentStatus.SUBMITTED);
    
    // Submit form with updated status
    onSubmit();
    
    // Close modal
    setShowConfirmationModal(false);
    
    // Force navigation to teacher-feedback
    setCurrentStep("teacher-feedback");
  }, [form, onSubmit, setCurrentStep]);

  if (!currentStepConfig) return null;

  return (
    <div className="flex flex-col gap-4 md:gap-8 container my-4 md:my-10">
      {/* Progress - Full width on mobile, sidebar on desktop */}
      <div className="w-full md:hidden">
        <StepProgress 
          steps={STEPS}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          validateStep={(stepId: AssignmentStep) =>
            validateStep(stepId, form.getValues())
          }
          status={assignmentStatus}
        />
      </div>

      <div className="flex flex-col md:flex-row md:gap-8">
        {/* Left Sidebar - Progress (hidden on mobile) */}
        <div className="hidden md:block w-80 h-max border-2 border-slate-200 rounded-md">
          <StepProgress 
            steps={STEPS}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            validateStep={(stepId: AssignmentStep) =>
              validateStep(stepId, form.getValues())
            }
            status={assignmentStatus}
          />
        </div>

        {/* Main Content - Form */}
        <div className="flex-1">
          <Form {...form}>
            <form
              onSubmit={onSubmit}
              className="rounded-md border border-gray-200 space-y-0 flex flex-col h-[calc(100vh-8rem)] overflow-hidden"
            >
              <StepHeader
                title={currentStepConfig.header}
                description={currentStepConfig.description}
                showContinueButton={currentStep !== "teacher-feedback" && 
                  assignmentStatus !== AssignmentStatus.SUBMITTED && 
                  assignmentStatus !== AssignmentStatus.VERIFIED}
                onContinue={handleSaveAndContinue}
                disabled={isLoading || !isCurrentStepComplete()}
              />
              <section className="py-6 md:py-10 px-4 md:px-6 flex-1 overflow-y-auto">
                <StepContent step={currentStep} form={form} />
              </section>
            </form>
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
