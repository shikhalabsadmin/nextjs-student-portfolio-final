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
  type AssignmentStatus,
} from "@/constants/assignment-status";
import { GenericBreadcrumb } from "./AssignmentBreadcrumb";
import { ROUTES } from "@/config/routes";
import { isBasicInfoComplete } from "@/lib/utils/basic-info-validation";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

// Define required fields for each step
const STEP_REQUIRED_FIELDS = {
  'basic-info': ['title', 'artifact_type', 'subject', 'month', 'files', 'youtubelinks'],
  'role-originality': ['is_team_work', 'is_original_work', 'team_contribution', 'originality_explanation'],
  'skills-reflection': ['selected_skills', 'skills_justification', 'pride_reason'],
  'process-challenges': ['creation_process', 'learnings', 'challenges', 'improvements', 'acknowledgments'],
  'review-submit': [],
  'teacher-feedback': []
};

// Helper function to get required fields for a step
const getStepRequiredFields = (stepId: AssignmentStep): string[] => {
  return STEP_REQUIRED_FIELDS[stepId] || [];
};

type AssignmentFormProps = {
  user: User;
};

function AssignmentForm({ user }: AssignmentFormProps) {
  // State management
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const { toast } = useToast();

  // Form and assignment state from custom hook
  const {
    form,
    currentStep,
    setCurrentStep,
    handleSaveAndContinue,
    validateStep,
    isLoading,
    isContinueDisabled,
    handleSubmitAssignment,
  } = useAssignmentForm({ user });

  // Check if basic info is complete
  const basicInfoTabNotComplete = useMemo(() => {
    return !isBasicInfoComplete(form.getValues());
  }, [form.watch()]);

  // Check if all steps are complete for the Submit button
  const areAllStepsComplete = useMemo(() => {
    // Skip the review-submit step itself and teacher-feedback step
    const stepsToValidate = STEPS.filter(step => 
      step.id !== 'review-submit' && step.id !== 'teacher-feedback'
    );
    
    return stepsToValidate.every(step => validateStep(step.id));
  }, [validateStep, form.watch()]);

  // Derived state
  const assignmentStatus = form.getValues().status || ASSIGNMENT_STATUS.DRAFT;

  const currentStepConfig = useMemo(
    () => STEPS.find((step) => step.id === currentStep),
    [currentStep]
  );

  const filteredSteps = useMemo(() => {
    if (assignmentStatus === ASSIGNMENT_STATUS.DRAFT) {
      // For DRAFT status, show all steps except "teacher-feedback"
      return STEPS.filter((step) => step.id !== "teacher-feedback");
    } else if (assignmentStatus === ASSIGNMENT_STATUS.NEEDS_REVISION) {
      // For NEEDS_REVISION, show only "teacher-feedback"
      setCurrentStep("teacher-feedback");
      return STEPS.filter((step) => step.id === "teacher-feedback");
    } else if (assignmentStatus === ASSIGNMENT_STATUS.SUBMITTED) {
      // For SUBMITTED, show all steps but they'll be read-only
      return STEPS;
    } else {
      // For other statuses (e.g., APPROVED), show all steps
      return STEPS;
    }
  }, [assignmentStatus, setCurrentStep]);

  // Event handlers
  const handleSetCurrentStep = useCallback(
    (stepId: string) => {
      if (STEPS.some((step) => step.id === stepId)) {
        setCurrentStep(stepId as AssignmentStep);
      }
    },
    [setCurrentStep]
  );

  const handleSaveAndContinueClick = useCallback(async () => {
    if (currentStep === "review-submit") {
      // Only show confirmation modal if all steps are complete
      if (areAllStepsComplete) {
        setShowConfirmationModal(true);
      } else {
        // Show toast or alert that all steps must be complete
        toast({
          title: "Incomplete Assignment",
          description: "Please complete all required fields before submitting.",
          variant: "destructive",
        });
      }
      return;
    }
    
    // For other steps, trigger validation for the current step's fields
    // This will show red error messages for required fields
    const stepConfig = STEPS.find(step => step.id === currentStep);
    if (stepConfig) {
      // Get the fields for the current step from STEP_REQUIREMENTS
      const stepFields = getStepRequiredFields(currentStep as AssignmentStep);
      
      // Trigger validation only for the fields in the current step
      const isStepValid = await form.trigger(stepFields as any);
      
      if (isStepValid) {
        // If valid, save and continue
        handleSaveAndContinue();
      } else {
        // If invalid, show toast but let them navigate (errors will remain visible)
        toast({
          title: "Missing Required Fields",
          description: "Please fill in all required fields marked in red.",
          variant: "destructive",
        });
      }
    }
  }, [currentStep, handleSaveAndContinue, areAllStepsComplete, toast, form]);

  const handleConfirmSubmit = useCallback(async () => {
    try {
      await handleSubmitAssignment(form.getValues());
      setShowConfirmationModal(false);
      
      // Navigate to dashboard after successful submission
      window.location.href = ROUTES.STUDENT.DASHBOARD;
    } catch (error) {
      console.error("Error submitting assignment:", error);
      // Keep the modal open if there's an error
    }
  }, [handleSubmitAssignment, form]);

  // Shared props
  const stepProgressProps = {
    steps: filteredSteps,
    currentStep,
    setCurrentStep: handleSetCurrentStep,
    validateStep,
    status: assignmentStatus as AssignmentStatus,
    disabled: basicInfoTabNotComplete,
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
          { label: "New work", to: "" },
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
                  areAllStepsComplete={areAllStepsComplete}
                />
                <section className="px-3 py-2 md:px-6 md:py-4 flex-1 overflow-y-auto">
                  {assignmentStatus === ASSIGNMENT_STATUS.SUBMITTED && (
                    <div className="bg-amber-50 border border-amber-200 p-3 mb-4 rounded-md">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                        <p className="text-amber-800 text-sm mb-3 md:mb-0">
                          Your assignment has been submitted. You can view all
                          sections but cannot make any changes.
                        </p>
                        <Button 
                          variant="outline" 
                          onClick={() => window.location.href = ROUTES.STUDENT.DASHBOARD}
                          className="bg-white border-amber-500 text-amber-700 hover:bg-amber-50"
                        >
                          Return to Dashboard
                        </Button>
                      </div>
                    </div>
                  )}
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
