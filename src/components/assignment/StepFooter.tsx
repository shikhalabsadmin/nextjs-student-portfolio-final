import { Button } from "@/components/ui/button";
import { ASSIGNMENT_STATUS } from "@/constants/assignment-status";
import { cn } from "@/lib/utils";
import { AssignmentStep } from "@/types/assignment";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, Home, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/config/routes";
import { useAuthState } from "@/hooks/useAuthState";
import { UserRole } from "@/enums/user.enum";

type StepFooterProps = {
  onContinue: () => void;
  disabled: boolean;
  step: AssignmentStep;
  areAllStepsComplete?: boolean;
  className?: string;
  assignmentStatus?: string; // Add assignment status prop
};

export function StepFooter({
  onContinue,
  disabled,
  step,
  areAllStepsComplete = true,
  className,
  assignmentStatus = ASSIGNMENT_STATUS.DRAFT
}: StepFooterProps) {
  const navigate = useNavigate();
  const { user } = useAuthState();
  
  // ✅ Smart button visibility - show action buttons for incomplete assignments
  // Only show "view-only" message for truly complete and approved assignments
  const isCompleteAndApproved = assignmentStatus === ASSIGNMENT_STATUS.APPROVED;
  
  // Show a different message for submitted but incomplete assignments
  const isSubmittedButIncomplete = assignmentStatus === ASSIGNMENT_STATUS.SUBMITTED && !areAllStepsComplete;
  
  if (isCompleteAndApproved) {
    return (
      <div className={cn("flex justify-center items-center gap-3 pt-6 pb-4 border-t border-gray-100 mt-8", className)}>
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 font-medium">
            ✅ Assignment approved - View-only mode
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Assignment is complete and approved
          </p>
        </div>
      </div>
    );
  }
  
  // Show informational message for submitted but incomplete assignments
  if (isSubmittedButIncomplete) {
    return (
      <div className={cn("flex flex-col items-center gap-4 pt-6 pb-4 border-t border-gray-100 mt-8", className)}>
        <div className="text-center">
          <p className="text-sm text-amber-600 font-medium">
            ⚠️ Assignment submitted but incomplete
          </p>
          <p className="text-xs text-gray-500 mt-1">
            You can still edit and improve your work
          </p>
        </div>
      </div>
    );
  }
  
  // Determine if the button should be disabled
  // For review-submit step, disable if not all steps are complete
  // For other steps, use the provided disabled prop
  const isButtonDisabled = step === "review-submit" 
    ? disabled || !areAllStepsComplete 
    : disabled;
    
  // Function to navigate to the appropriate dashboard based on user role
  const handleGoToDashboard = () => {
    if (!user) {
      navigate(ROUTES.COMMON.HOME);
      return;
    }
    
    switch (user.role) {
      case UserRole.STUDENT:
        navigate(ROUTES.STUDENT.DASHBOARD);
        break;
      case UserRole.TEACHER:
        navigate(ROUTES.TEACHER.DASHBOARD);
        break;
      case UserRole.ADMIN:
        navigate(ROUTES.ADMIN.DASHBOARD);
        break;
      default:
        navigate(ROUTES.COMMON.HOME);
    }
  };

  // Check if current step is teacher feedback or assignment preview
  const isTeacherFeedbackStep = step === "teacher-feedback";
  const isAssignmentPreviewStep = step === "assignment-preview";
  
  // Check if review step with incomplete steps
  const isIncompleteReviewStep = step === "review-submit" && !areAllStepsComplete;

  // Special case for assignment-preview step (submission confirmation)
  if (step === "assignment-preview") {
    return (
      <div className={cn("flex flex-col items-center gap-4 pt-6 pb-4 border-t border-gray-100 mt-8", className)}>
        <p className="text-center text-sm text-gray-600">
          Your assignment has been submitted successfully and is ready for teacher review.
        </p>
        <Button
          type="button"
          onClick={handleGoToDashboard}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span>Go to Dashboard</span>
        </Button>
      </div>
    );
  }

  // Don't show footer for teacher feedback step (has button in header now)
  if (isTeacherFeedbackStep) {
    return null;
  }

  // Debug logging to help identify button visibility issues
  console.log("StepFooter render:", {
    step,
    assignmentStatus,
    areAllStepsComplete,
    disabled,
    isCompleteAndApproved,
    isSubmittedButIncomplete
  });

  return (
    <div className={cn("flex flex-col sm:flex-row justify-between items-center gap-3 pt-6 pb-4 border-t border-gray-100 mt-8", className)}>
      {/* Save Draft button (show for non-review steps, allowing editing of incomplete submissions) */}
      {step !== "review-submit" && (
        <Button
          type="button"
          variant="outline"
          onClick={onContinue}
          disabled={isButtonDisabled}
          className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Draft</span>
        </Button>
      )}

      {/* Main action button */}
      {isIncompleteReviewStep ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center w-full sm:w-auto">
                <Button
                  type="button"
                  disabled={true}
                  className="w-full bg-[#6366F1] hover:bg-[#6366F1]/90 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition-colors opacity-60"
                >
                  Submit Assignment
                </Button>
                <AlertCircle className="ml-2 h-5 w-5 text-amber-500" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-white p-3 border border-gray-200 shadow-md max-w-xs">
              <p className="text-sm text-gray-700">Please complete all required fields in previous steps before submitting.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <Button
          type="button"
          onClick={onContinue}
          disabled={isButtonDisabled}
          className="w-full sm:w-auto bg-[#6366F1] hover:bg-[#6366F1]/90 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition-colors shadow-md hover:shadow-lg"
        >
          {step === "review-submit" ? "Submit Assignment" : "Save & Continue"}
        </Button>
      )}
    </div>
  );
} 