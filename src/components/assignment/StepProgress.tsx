import { useState, useMemo, useCallback, useEffect } from "react";
import { type StepConfig } from "@/types/assignment";
import { ASSIGNMENT_STATUS, AssignmentStatus } from "@/constants/assignment-status";
import { StepButton } from "@/components/assignment/StepButton";
import { StepIndicator } from "@/components/assignment/StepIndicator";
import { getFilteredSteps } from "@/utils/student-assignment-steps-utils";
import { ChevronUp } from "lucide-react";
import { ChevronDown } from "lucide-react";

// Define props interface with proper documentation
interface StepProgressProps {
  /** Array of step configurations */
  steps: StepConfig[];
  /** Current active step ID */
  currentStep: string;
  /** Callback to update the current step */
  setCurrentStep: (stepId: string) => void;
  /** Function to validate if a step is complete */
  validateStep: (stepId: string) => boolean;
  /** Assignment status, defaults to DRAFT */
  status?: AssignmentStatus;
}

/**
 * StepProgress component displays a progress tracker with collapsible steps for mobile
 * and a fixed sidebar for desktop views.
 */
export function StepProgress({
  steps,
  currentStep,
  setCurrentStep,
  validateStep,
  status = ASSIGNMENT_STATUS.DRAFT,
}: StepProgressProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Memoize filtered steps to prevent unnecessary recalculations
  const filteredSteps = useMemo(() => {
    const filtered = getFilteredSteps(steps, status);
    // Ensure we always have at least one step
    return filtered.length > 0 ? filtered : steps;
  }, [steps, status]);
  
  // Memoize derived data
  const currentStepData = useMemo(() => {
    const stepData = filteredSteps.find((step) => step.id === currentStep);
    // If current step not found in filtered steps, default to first available step
    if (!stepData && filteredSteps.length > 0) {
      return filteredSteps[0];
    }
    return stepData;
  }, [filteredSteps, currentStep]);

  // Update current step if it's not in filtered steps
  useEffect(() => {
    if (filteredSteps.length > 0 && !filteredSteps.some(step => step.id === currentStep)) {
      setCurrentStep(filteredSteps[0].id);
    }
  }, [filteredSteps, currentStep, setCurrentStep]);

  // Optimize toggle handler
  const toggleExpand = useCallback(() => setIsExpanded((prev) => !prev), []);

  return (
    <div className="w-full">
      {/* Mobile view */}
      <div className="md:hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-sm font-medium text-gray-900">Your Progress</h2>
        </div>
        <button
          onClick={toggleExpand}
          className="flex justify-between items-center w-full p-4 bg-white hover:bg-slate-50 transition-colors"
          aria-expanded={isExpanded}
          aria-controls="step-progress-mobile"
        >
          <div className="flex items-center gap-3">
            <StepIndicator 
              isComplete={validateStep(currentStep)} 
              isCurrent={true}
            />
            <span className="font-medium text-gray-900">
              {currentStepData?.title || "Current Step"}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-500" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" aria-hidden="true" />
          )}
        </button>

        {isExpanded && (
          <div 
            id="step-progress-mobile"
            className="border-t border-slate-200 p-3 bg-white animate-in slide-in-from-top duration-200"
          >
            <nav className="space-y-2" aria-label="Step navigation">
              {filteredSteps.map((step) => (
                <StepButton
                  key={step.id}
                  step={step}
                  isCurrent={currentStep === step.id}
                  isComplete={validateStep(step.id)}
                  onClick={() => {
                    setCurrentStep(step.id);
                    setIsExpanded(false);
                  }}
                />
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Desktop view */}
      <div className="hidden md:block">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-base font-medium text-gray-900">Your Progress</h2>
        </div>
        <nav className="space-y-2.5 px-4 py-6" aria-label="Step navigation">
          {filteredSteps.map((step) => (
            <StepButton
              key={step.id}
              step={step}
              isCurrent={currentStep === step.id}
              isComplete={validateStep(step.id)}
              onClick={() => setCurrentStep(step.id)}
            />
          ))}
        </nav>
      </div>
    </div>
  );
}