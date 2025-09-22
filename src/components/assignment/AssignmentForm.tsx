import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { useParams } from "react-router-dom";
import { Form } from "@/components/ui/form";
import { Loading } from "@/components/ui/loading";
import {
  StepContent,
  StepHeader,
  ConfirmationModal,
  StepProgress,
} from "@/components/assignment";
import { StepFooter } from "@/components/assignment/StepFooter";
import { useAssignmentForm } from "@/hooks/useAssignmentForm";
import { STEPS } from "@/lib/config/steps";
import { type AssignmentStep } from "@/types/assignment";
import {
  ASSIGNMENT_STATUS,
  type AssignmentStatus,
} from "@/constants/assignment-status";
import { GenericBreadcrumb } from "./AssignmentBreadcrumb";
import { ROUTES } from "@/config/routes";
import { isBasicInfoComplete, isBasicInfoNavigationComplete } from "@/lib/utils/basic-info-validation";
import { useToast } from "@/components/ui/use-toast";
import { getFilteredSteps } from "@/utils/student-assignment-steps-utils";

// Define required fields for each step
const STEP_REQUIRED_FIELDS = {
  'basic-info': ['title', 'artifact_type', 'subject', 'month', 'files', 'youtubelinks'],
  'role-originality': ['is_team_work', 'is_original_work', 'team_contribution', 'originality_explanation'],
  'skills-reflection': ['selected_skills', 'skills_justification', 'pride_reason'],
  'process-challenges': ['creation_process', 'learnings', 'challenges', 'improvements', 'acknowledgments'],
  'review-submit': [],
  'assignment-preview': [],
  'teacher-feedback': []
};

// Helper function to get required fields for a step
const getStepRequiredFields = (stepId: AssignmentStep): string[] => {
  return STEP_REQUIRED_FIELDS[stepId] || [];
};

type AssignmentFormProps = {
  user: User & { grade?: string };
};

function AssignmentForm({ user }: AssignmentFormProps) {
  // Get the current route params
  const { id: routeId } = useParams<{ id: string }>();
  
  // State management
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const { toast } = useToast();
  const backupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    manualEditEnabled,
    setManualEditEnabled,
    saveData, // Add saveData function for draft saving without validation
  } = useAssignmentForm({ user });

  // Derived state - moved up to be available for other useMemo hooks
  // Use form.watch to make this reactive to status changes after submission
  const assignmentStatus = form.watch("status") || ASSIGNMENT_STATUS.DRAFT;

  // Check if basic info is complete (for green check display)
  const basicInfoTabNotComplete = useMemo(() => {
    return !isBasicInfoComplete(form.getValues());
  }, [form.watch("title"), form.watch("artifact_type"), form.watch("subject"), form.watch("month"), form.watch("files"), form.watch("externalLinks"), form.watch("youtubelinks")]); // Watch the actual fields that matter for basic info completion


  // ✅ OPTIMIZED: Only validate all steps when actually on review-submit step
  const areAllStepsComplete = useMemo(() => {
    if (currentStep !== 'review-submit') {
      console.log("🔧 OPTIMIZATION: Skipping all-steps validation - not on review step");
      return false;
    }
    
    console.log("🔍 RUNNING ALL-STEPS VALIDATION (on review-submit step)");
    // Always validate the core work steps when on review step
    const workStepsToValidate = STEPS.filter(step => 
      step.id !== 'review-submit' && 
      step.id !== 'assignment-preview' && 
      step.id !== 'teacher-feedback'
    );
    
    const allComplete = workStepsToValidate.every(step => {
      const isValid = validateStep(step.id);
      return isValid;
    });
    return allComplete;
  }, [currentStep, validateStep]);

  const currentStepConfig = useMemo(
    () => STEPS.find((step) => step.id === currentStep),
    [currentStep]
  );

  const filteredSteps = useMemo(() => {
    // ✅ CRITICAL FIX: For basic navigation, we don't need to validate all steps
    // Steps filtering is now based on status only, not completion validation
    const steps = getFilteredSteps(STEPS, assignmentStatus, false);
    
    return steps;
  }, [assignmentStatus]);

  // Check if navigation should be allowed (separate from completion status)
  const isNavigationAllowed = useMemo(() => {
    const formValues = form.getValues();
    // Allow navigation if basic text fields are filled (no files required for navigation)
    return isBasicInfoNavigationComplete(formValues);
  }, [form.watch("title"), form.watch("artifact_type"), form.watch("subject"), form.watch("month")]);

  // Handle save draft without validation restrictions
  const handleSaveDraft = useCallback(async () => {
    try {
      const formData = form.getValues();
      const formId = formData.id;
      
      if (formId) {
        // For existing assignments, use the saveData function which doesn't require validation
        await saveData(formId, formData);
        toast({
          title: "Draft saved",
          description: "Your progress has been saved.",
        });
      } else {
        // For new assignments, trigger the auto-save/create process
        await handleSaveAndContinue();
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      toast({
        title: "Error saving draft",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  }, [form, saveData, handleSaveAndContinue, toast]);

  // Event handlers
  const handleSetCurrentStep = useCallback(
    (stepId: string) => {
      if (filteredSteps.some((step) => step.id === stepId)) {
        setCurrentStep(stepId as AssignmentStep);
      }
    },
    [setCurrentStep, filteredSteps, currentStep, assignmentStatus]
  );

  const handleEnableManualEdit = useCallback(() => {
    setManualEditEnabled(true);
  }, [setManualEditEnabled]);

  // Simplified backup logic - now handled in useAssignmentForm
  useEffect(() => {
    // Try to restore data on mount if needed
    const formId = form.getValues().id;
    if (formId && !isLoading) {
      // The restore logic is now handled in useAssignmentForm
    }
  }, [form, isLoading]);

  // ✅ REMOVED: Complex backup system - now handled by simplified auto-save in hook

  const handleSaveAndContinueClick = useCallback(async () => {
    console.log("🚀 SAVE & CONTINUE CLICKED:", { 
      currentStep, 
      formId: form.getValues().id,
      hasData: !!form.getValues().title,
      allFormData: form.getValues()
    });
    
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
    
    try {
      // Get current form data
      const formData = form.getValues();
      
      // For other steps, trigger validation for the current step's fields
      const stepConfig = STEPS.find(step => step.id === currentStep);
      if (stepConfig) {
        // Get the fields for the current step from STEP_REQUIREMENTS
        const stepFields = getStepRequiredFields(currentStep as AssignmentStep);
        
        // Check current step validation BEFORE form.trigger (navigation context - files not required)
        console.log(`🎯 VALIDATING CURRENT STEP FOR NAVIGATION: ${currentStep}`);
        const currentStepValid = validateStep(currentStep, { isForNavigation: true });
        
        // ENHANCED: Trigger validation for specific fields and set custom errors
        const isStepValid = await form.trigger(stepFields as any);
        
        console.log("🔍 VALIDATION RESULTS:", {
          currentStep,
          stepFields,
          isStepValid,
          currentStepValid,
          overall: isStepValid && currentStepValid
        });
        
        // ENHANCED: If validation fails, set specific field errors for visual feedback
        if (!isStepValid || !currentStepValid) {
          console.log("❌ VALIDATION FAILED - Setting custom errors for step:", currentStep);
          
          // Set specific field errors for better visual feedback
          if (currentStep === 'skills-reflection') {
            if (!formData.selected_skills || formData.selected_skills.length === 0) {
              form.setError('selected_skills', {
                type: 'required',
                message: 'Please select at least one skill'
              });
            }
            if (!formData.skills_justification?.trim()) {
              form.setError('skills_justification', {
                type: 'required',
                message: 'Please explain how each skill contributed to your work'
              });
            }
            if (!formData.pride_reason?.trim()) {
              form.setError('pride_reason', {
                type: 'required',
                message: 'Please describe why you are proud of this work'
              });
            }
          } else if (currentStep === 'basic-info') {
            console.log("🔍 BASIC INFO VALIDATION CHECK:", {
              title: formData.title,
              artifact_type: formData.artifact_type,
              subject: formData.subject,
              month: formData.month,
              files: formData.files,
              youtubelinks: formData.youtubelinks,
              externalLinks: formData.externalLinks
            });
            
            if (!formData.title?.trim()) {
              console.log("❌ BASIC INFO: Title validation failed");
              form.setError('title', {
                type: 'required',
                message: 'Title is required'
              });
            }
            if (!formData.artifact_type) {
              console.log("❌ BASIC INFO: Artifact type validation failed");
              form.setError('artifact_type', {
                type: 'required',
                message: 'Please select an artifact type'
              });
            }
            if (!formData.subject) {
              console.log("❌ BASIC INFO: Subject validation failed");
              form.setError('subject', {
                type: 'required',
                message: 'Please select a subject'
              });
            }
            if (!formData.month) {
              console.log("❌ BASIC INFO: Month validation failed");
              form.setError('month', {
                type: 'required',
                message: 'Please select a month'
              });
            }
            
            console.log("✅ BASIC INFO: Files/work validation SKIPPED for Save & Continue (only required for submission)");
            // NOTE: Files/links are not required for navigation between steps
            // They are only required for final submission (handled elsewhere)
          } else if (currentStep === 'role-originality') {
            if (formData.is_team_work === undefined) {
              form.setError('is_team_work', {
                type: 'required',
                message: 'Please specify if this was team work'
              });
            }
            if (formData.is_original_work === undefined) {
              form.setError('is_original_work', {
                type: 'required',
                message: 'Please specify if this is original work'
              });
            }
            if (formData.is_team_work && !formData.team_contribution?.trim()) {
              form.setError('team_contribution', {
                type: 'required',
                message: 'Please describe your contribution to the team work'
              });
            }
            if (formData.is_original_work && !formData.originality_explanation?.trim()) {
              form.setError('originality_explanation', {
                type: 'required',
                message: 'Please explain what makes this work original'
              });
            }
          }
          
          // Show contextual error message
          toast({
            title: "Missing Required Fields",
            description: "Please fill in the highlighted fields in red below.",
            variant: "destructive",
          });
          
          // Focus on the first field with an error
          const errors = form.formState.errors;
          const firstErrorField = Object.keys(errors)[0];
          if (firstErrorField) {
            setTimeout(() => {
              const element = document.getElementsByName(firstErrorField)[0] || 
                            document.querySelector(`[name="${firstErrorField}"]`) ||
                            document.getElementById(firstErrorField);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if ('focus' in element) {
                  (element as HTMLElement).focus();
                }
              }
            }, 100);
          }
          
          console.log("❌ STOPPING EXECUTION - Validation failed for step:", currentStep);
          return; // Don't proceed if validation failed
        }
        
        console.log("✅ VALIDATION PASSED - Proceeding with save and continue for step:", currentStep);
        // If validation passes, clear any existing errors and proceed
        form.clearErrors();
        await handleSaveAndContinue();
        console.log("🎉 SAVE & CONTINUE COMPLETED SUCCESSFULLY for step:", currentStep);
      }
    } catch (error) {
      console.error("STEP CLICK: Error in save and continue:", error);
      // Data is automatically preserved by the auto-save system
    }
  }, [currentStep, handleSaveAndContinue, areAllStepsComplete, toast, form, validateStep]);

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
    // Allow navigation based on text fields only (not file uploads)
    disabled: !isNavigationAllowed,
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
    <Form {...form}>
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
                {/* Step Header */}
                <StepHeader
                  title={currentStepConfig?.title || "Step"}
                  description={currentStepConfig?.description}
                  onContinue={handleSaveAndContinueClick}
                  disabled={isContinueDisabled}
                  step={currentStep}
                  areAllStepsComplete={areAllStepsComplete}
                  assignmentStatus={assignmentStatus}
                />

                {/* Step Content */}
                <StepContent
                  step={currentStep}
                  form={form}
                  onContinue={handleSaveAndContinueClick}
                  disabled={isContinueDisabled}
                  areAllStepsComplete={areAllStepsComplete}
                />

                {/* Step Footer */}
                <StepFooter
                  onContinue={handleSaveAndContinueClick}
                  onSaveDraft={handleSaveDraft}
                  disabled={isContinueDisabled}
                  step={currentStep}
                  areAllStepsComplete={areAllStepsComplete}
                  assignmentStatus={assignmentStatus} // ✅ Pass assignment status
                  onEnableEdit={handleEnableManualEdit}
                />
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
    </Form>
  );
}

// Change from named export to default export to fix lazy loading issues
export default AssignmentForm;
