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
};

export function StepFooter({
  onContinue,
  disabled,
  step,
  areAllStepsComplete = true,
  className
}: StepFooterProps) {
  const navigate = useNavigate();
  const { user } = useAuthState();
  
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

  // Check if current step is teacher feedback
  const isTeacherFeedbackStep = step === "teacher-feedback";
  
  // Check if review step with incomplete steps
  const isIncompleteReviewStep = step === "review-submit" && !areAllStepsComplete;

  // Don't show footer for teacher feedback step (has its own navigation)
  if (isTeacherFeedbackStep) {
    return (
      <div className={cn("flex justify-center pt-6 pb-4", className)}>
        <Button 
          onClick={handleGoToDashboard}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span>Go to Dashboard</span>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col sm:flex-row justify-between items-center gap-3 pt-6 pb-4 border-t border-gray-100 mt-8", className)}>
      {/* Save Draft button (only show for non-review steps) */}
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