import { Button } from "@/components/ui/button";
import { ASSIGNMENT_STATUS } from "@/constants/assignment-status";
import { cn } from "@/lib/utils";
import { AssignmentStep } from "@/types/assignment";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle } from "lucide-react";

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
  // Determine if the button should be disabled
  // For review-submit step, disable if not all steps are complete
  // For other steps, use the provided disabled prop
  const isButtonDisabled = step === "review-submit" 
    ? disabled || !areAllStepsComplete 
    : disabled;

  return (
    <div className="sticky top-0 z-10 flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center border-b border-gray-200 p-3 sm:p-5 bg-white">
      <div>
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">
          {title}
        </h2>
        <p className="text-gray-600 text-xs sm:text-sm md:text-base mt-1 sm:mt-2">
          {description}
        </p>
      </div>
      
      {step === "review-submit" && !areAllStepsComplete ? (
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
          className={cn('mt-2 sm:mt-0 w-full sm:w-auto bg-[#6366F1] hover:bg-[#6366F1]/90 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors',`${step === "teacher-feedback" ? "hidden" : ""}`)}
        >
          {step === "review-submit" ? "Submit" : "Save & Continue"}
        </Button>
      )}
    </div>
  );
}
