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
import { isBasicInfoComplete } from "@/lib/utils/basic-info-validation";
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
  user: User;
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
  } = useAssignmentForm({ user });

  // Derived state - moved up to be available for other useMemo hooks
  const assignmentStatus = form.getValues().status || ASSIGNMENT_STATUS.DRAFT;

  // Check if basic info is complete
  const basicInfoTabNotComplete = useMemo(() => {
    return !isBasicInfoComplete(form.getValues());
  }, [form.watch("title"), form.watch("artifact_type"), form.watch("subject"), form.watch("month"), form.watch("files"), form.watch("externalLinks"), form.watch("youtubelinks")]); // Watch the actual fields that matter for basic info completion

  // ✅ FIXED: Check if all required work steps are actually complete (regardless of status)
  const areAllStepsComplete = useMemo(() => {
    // Always validate the core work steps, regardless of assignment status
    const workStepsToValidate = STEPS.filter(step => 
      step.id !== 'review-submit' && 
      step.id !== 'assignment-preview' && 
      step.id !== 'teacher-feedback'
    );
    
    console.log("STEP VALIDATION: Checking all work steps", {
      currentStep,
      stepsToValidate: workStepsToValidate.map(s => s.id),
      status: assignmentStatus
    });
    
    const allComplete = workStepsToValidate.every(step => {
      const isValid = validateStep(step.id);
      console.log(`STEP VALIDATION: Step ${step.id} is ${isValid ? 'valid' : 'invalid'}`);
      return isValid;
    });
    
    console.log("STEP VALIDATION: Overall result:", { allComplete, assignmentStatus });
    return allComplete;
  }, [validateStep, form.formState.isDirty, currentStep, assignmentStatus]);

  const currentStepConfig = useMemo(
    () => STEPS.find((step) => step.id === currentStep),
    [currentStep]
  );

  const filteredSteps = useMemo(() => {
    // ✅ CRITICAL FIX: Pass actual completion state to prevent showing submitted/feedback steps for incomplete work
    const steps = getFilteredSteps(STEPS, assignmentStatus, areAllStepsComplete);
    
    return steps;
  }, [assignmentStatus, areAllStepsComplete]);

  // Event handlers
  const handleSetCurrentStep = useCallback(
    (stepId: string) => {
      console.log('[AssignmentForm Debug] handleSetCurrentStep called:', {
        stepId,
        filteredStepsIds: filteredSteps.map(s => s.id),
        currentStep,
        assignmentStatus
      });
      
      if (filteredSteps.some((step) => step.id === stepId)) {
        console.log('[AssignmentForm Debug] Setting current step to:', stepId);
        setCurrentStep(stepId as AssignmentStep);
      } else {
        console.log('[AssignmentForm Debug] Step not found in filtered steps:', stepId);
      }
    },
    [setCurrentStep, filteredSteps, currentStep, assignmentStatus]
  );

  // Simplified backup logic - now handled in useAssignmentForm
  useEffect(() => {
    // Try to restore data on mount if needed
    const formId = form.getValues().id;
    if (formId && !isLoading) {
      console.log("AssignmentForm mounted with ID:", formId);
      // The restore logic is now handled in useAssignmentForm
    }
  }, [form, isLoading]);

  // ✅ REMOVED: Complex backup system - now handled by simplified auto-save in hook

  const handleSaveAndContinueClick = useCallback(async () => {
    console.log("STEP CLICK: Save and continue clicked", { 
      currentStep, 
      formId: form.getValues().id,
      hasData: !!form.getValues().title 
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
      // Get current form data for debugging
      const formData = form.getValues();
      console.log("STEP CLICK: Current form data", {
        id: formData.id,
        title: formData.title,
        step: currentStep,
        hasBasicInfo: !!(formData.title && formData.artifact_type && formData.subject),
        hasRoleInfo: !!(formData.is_team_work !== undefined && formData.is_original_work !== undefined),
        // Add skills-reflection specific debugging
        hasSkillsInfo: currentStep === 'skills-reflection' ? {
          selected_skills: formData.selected_skills,
          skills_justification: formData.skills_justification,
          pride_reason: formData.pride_reason,
          hasSelectedSkills: Array.isArray(formData.selected_skills) && formData.selected_skills.length > 0,
          hasSkillsJustification: Boolean(formData.skills_justification?.trim()),
          hasPrideReason: Boolean(formData.pride_reason?.trim())
        } : undefined
      });
      
      // For other steps, trigger validation for the current step's fields
      const stepConfig = STEPS.find(step => step.id === currentStep);
      if (stepConfig) {
        // Get the fields for the current step from STEP_REQUIREMENTS
        const stepFields = getStepRequiredFields(currentStep as AssignmentStep);
        
        console.log("STEP CLICK: Validating step fields", { step: currentStep, fields: stepFields });
        
        // Check current step validation BEFORE form.trigger
        const currentStepValid = validateStep(currentStep);
        console.log("STEP CLICK: Current step validation result", { 
          step: currentStep, 
          isValid: currentStepValid,
          formErrors: form.formState.errors
        });
        
        // ENHANCED: Trigger validation for specific fields and set custom errors
        const isStepValid = await form.trigger(stepFields as any);
        console.log("STEP CLICK: Form trigger validation result", { step: currentStep, isValid: isStepValid });
        
        // ENHANCED: If validation fails, set specific field errors for visual feedback
        if (!isStepValid || !currentStepValid) {
          console.log("STEP CLICK: Validation failed, setting field-specific errors");
          
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
            if (!formData.title?.trim()) {
              form.setError('title', {
                type: 'required',
                message: 'Title is required'
              });
            }
            if (!formData.artifact_type) {
              form.setError('artifact_type', {
                type: 'required',
                message: 'Please select an artifact type'
              });
            }
            if (!formData.subject) {
              form.setError('subject', {
                type: 'required',
                message: 'Please select a subject'
              });
            }
            if (!formData.month) {
              form.setError('month', {
                type: 'required',
                message: 'Please select a month'
              });
            }
            // Check for files/links
            const hasFiles = Array.isArray(formData.files) && formData.files.length > 0;
            const hasYoutubeLinks = Array.isArray(formData.youtubelinks) && 
              formData.youtubelinks.some(link => link?.url && link.url.trim().length > 0);
            const hasExternalLinks = Array.isArray(formData.externalLinks) && 
              formData.externalLinks.some(link => link?.url && link.url.trim().length > 0);
            
            if (!hasFiles && !hasYoutubeLinks && !hasExternalLinks) {
              form.setError('files', {
                type: 'required',
                message: 'Please add at least one file, YouTube link, or external link'
              });
            }
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
          
          return; // Don't proceed if validation failed
        }
        
        // If validation passes, clear any existing errors and proceed
        form.clearErrors();
        console.log("STEP CLICK: Step valid, proceeding to save and continue");
        await handleSaveAndContinue();
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
    // Pass the actual disabled state based on basic info completion for draft assignments
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
                  disabled={isContinueDisabled}
                  step={currentStep}
                  areAllStepsComplete={areAllStepsComplete}
                  assignmentStatus={assignmentStatus} // ✅ Pass assignment status
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
