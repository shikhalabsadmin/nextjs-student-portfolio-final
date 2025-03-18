import { cn } from "@/lib/utils";
import { type StepConfig } from "@/types/assignment";
import { useState } from "react";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { AssignmentStatus } from "@/types/assignment-status";

type StepProgressProps = {
  steps: StepConfig[];
  currentStep: string;
  setCurrentStep: (step: string) => void;
  validateStep: (stepId: string) => boolean;
  status?: string; // Add assignment status prop
};

export function StepProgress({
  steps,
  currentStep,
  setCurrentStep,
  validateStep,
  status = AssignmentStatus.DRAFT, // Default to DRAFT if not provided
}: StepProgressProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Filter steps based on assignment status
  const filteredSteps = getFilteredSteps(steps, status);
  
  const currentStepData = filteredSteps.find((step) => step.id === currentStep);
  const currentStepIndex = filteredSteps.findIndex((step) => step.id === currentStep);
  
  // Calculate progress percentage
  const completedSteps = filteredSteps.filter((step) => validateStep(step.id)).length;
  const progressPercentage = Math.round((completedSteps / filteredSteps.length) * 100);

  // Mobile view toggle
  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <>
      {/* Mobile view - Modern design with progress bar */}
      <div className="md:hidden w-full rounded-lg border border-slate-200 bg-white shadow-sm">
        {/* Progress header with percentage */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-medium text-gray-900">Your Progress</h2>
            <span className="text-sm font-medium text-blue-600">{progressPercentage}% Complete</span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Current step button */}
        <button
          onClick={toggleExpand}
          className="flex justify-between items-center w-full p-4 bg-white hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <StepIndicator isComplete={validateStep(currentStep)} isCurrent={true} />
            </div>
            <span className="font-medium text-gray-900">
              {currentStepData?.title || "Current Step"}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>

        {/* Mobile expanded view with animation */}
        {isExpanded && (
          <div className="border-t border-slate-200 p-3 bg-white animate-in slide-in-from-top duration-200">
            <div className="space-y-2">
              {filteredSteps.map((step) => {
                const isCurrent = currentStep === step.id;
                const isComplete = validateStep(step.id);

                return (
                  <button
                    key={step.id}
                    onClick={() => {
                      setCurrentStep(step.id);
                      setIsExpanded(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors w-full text-left",
                      isCurrent 
                        ? "bg-blue-50 border border-blue-100" 
                        : "hover:bg-slate-50 border border-transparent"
                    )}
                  >
                    <div className="relative flex-shrink-0">
                      <StepIndicator isComplete={isComplete} isCurrent={isCurrent} />
                    </div>
                    <span
                      className={cn(
                        "text-sm",
                        isCurrent ? "font-medium text-gray-900" : "text-gray-600"
                      )}
                    >
                      {step.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Desktop view - Same as original */}
      <div className="hidden md:block">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-base font-medium text-gray-900">Your Progress</h2>
        </div>
        <div className="space-y-2.5 px-4 py-6">
          {filteredSteps.map((step) => {
            const isCurrent = currentStep === step.id;
            const isComplete = validateStep(step.id);

            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 transition-colors w-full text-left",
                  isCurrent ? "bg-blue-50" : "hover:bg-gray-50"
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                <StepIndicator isComplete={isComplete} isCurrent={isCurrent} />
                <span
                  className={cn(
                    "text-sm",
                    isCurrent ? "font-medium text-gray-900" : "text-gray-500"
                  )}
                >
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

// Helper function to filter steps based on assignment status
function getFilteredSteps(steps: StepConfig[], status: string): StepConfig[] {
  // For SUBMITTED or VERIFIED statuses, only show teacher-feedback
  if (status === AssignmentStatus.SUBMITTED || status === AssignmentStatus.VERIFIED) {
    console.log(`StepProgress: Status is ${status}, showing only teacher-feedback tab`);
    return steps.filter(step => step.id === 'teacher-feedback');
  }
  
  // For all other statuses (DRAFT, NOT_STARTED, NEEDS_REVISION, REJECTED), show all steps
  console.log(`StepProgress: Status is ${status}, showing all tabs`);
  return steps;
}

type StepIndicatorProps = {
  isComplete: boolean;
  isCurrent: boolean;
};

function StepIndicator({ isComplete, isCurrent }: StepIndicatorProps) {
  if (isComplete) {
    return (
      <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center text-white">
        <Check className="h-3 w-3" />
      </div>
    );
  }
  
  return (
    <div
      className={cn(
        "h-5 w-5 rounded-full",
        isCurrent
          ? "bg-blue-500"
          : "border border-gray-300"
      )}
    />
  );
} 