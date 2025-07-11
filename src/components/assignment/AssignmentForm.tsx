import { useState, useCallback, useMemo } from "react";
import { User } from "@supabase/supabase-js";
import { useParams } from "react-router-dom";
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
  // Get the current route params
  const { id: routeId } = useParams<{ id: string }>();
  
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

  const handleConfirmSubmit = useCallback(() => {
    handleSubmitAssignment(form.getValues());
    setShowConfirmationModal(false);
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
    <div className="px-3 sm:px-8 md:px-16 py-3 sm:py-6 flex flex-col gap-3 sm:gap-6 mobile-container">
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
          container: "!w-full !max-w-none !px-0 overflow-x-auto",
        }}
      />

      <div className="flex flex-col gap-3 sm:gap-4 mobile-spacing-y">
        {/* Mobile step progress */}
        <div className="w-full md:hidden">
          <StepProgress {...stepProgressProps} />
        </div>

        {/* Main content area with sidebar */}
        <div className="flex flex-col md:flex-row gap-3 sm:gap-6">
          {/* Sidebar for desktop */}
          <div className="hidden md:block w-64 shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden sticky top-4">
              <StepProgress {...stepProgressProps} />
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Step header */}
              {currentStepConfig && (
                <StepHeader
                  title={currentStepConfig.title}
                  description={currentStepConfig.description}
                  onContinue={handleSaveAndContinueClick}
                  disabled={isContinueDisabled}
                  step={currentStep as AssignmentStep}
                  areAllStepsComplete={areAllStepsComplete}
                />
              )}

              {/* Form */}
              <Form {...form}>
                <form className="p-3 sm:p-6">
                  <StepContent step={currentStep as AssignmentStep} form={form} />
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={showConfirmationModal}
        onOpenChange={setShowConfirmationModal}
        onConfirm={handleConfirmSubmit}
      />
    </div>
  );
}

// Change from named export to default export to fix lazy loading issues
export default AssignmentForm;
