import { Button } from "@/components/ui/button";
import { ASSIGNMENT_STATUS } from "@/constants/assignment-status";
import { cn } from "@/lib/utils";
import { AssignmentStep } from "@/types/assignment";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/config/routes";
import { useAuthState } from "@/hooks/useAuthState";
import { UserRole } from "@/enums/user.enum";

type StepHeaderProps = {
  title: string;
  description: string;
  onContinue: () => void;
  disabled: boolean;
  step: AssignmentStep;
  areAllStepsComplete?: boolean;
};

export function StepHeader({
  title,
  description,
  onContinue,
  disabled,
  step,
  areAllStepsComplete = true,
}: StepHeaderProps) {
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

  return (
    <div className="sticky top-0 z-10 flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center border-b border-gray-200 p-3 sm:p-5 bg-white">
      <div className="flex flex-col">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">
          {title}
        </h2>
        <p className="text-gray-600 text-xs sm:text-sm md:text-base mt-1">
          {description}
        </p>
      </div>
      
      {isTeacherFeedbackStep ? (
        <div className="mt-2 sm:mt-0">
          <Button 
            onClick={handleGoToDashboard}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </Button>
        </div>
      ) : isIncompleteReviewStep ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center">
                <Button
                  type="button"
                  disabled={true}
                  className="mt-2 sm:mt-0 w-full sm:w-auto bg-[#6366F1] hover:bg-[#6366F1]/90 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors opacity-60"
                >
                  Submit
                </Button>
                <AlertCircle className="ml-2 h-5 w-5 text-amber-500" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-white p-2 border border-gray-200 shadow-md">
              <p className="text-sm text-gray-700">Please complete all required fields in previous steps before submitting.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <Button
          type="button"
          onClick={onContinue}
          disabled={isButtonDisabled}
          className={cn('mt-2 sm:mt-0 w-full sm:w-auto bg-[#6366F1] hover:bg-[#6366F1]/90 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors', isTeacherFeedbackStep ? "hidden" : "")}
        >
          {step === "review-submit" ? "Submit" : "Save & Continue"}
        </Button>
      )}
    </div>
  );
}
