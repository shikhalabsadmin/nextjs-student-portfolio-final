import { useState, useMemo, useCallback, useEffect } from "react";
import { AssignmentStep, type StepConfig } from "@/types/assignment";
import {
  ASSIGNMENT_STATUS,
  AssignmentStatus,
} from "@/constants/assignment-status";
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
  validateStep: (stepId: AssignmentStep) => boolean;
  /** Assignment status, defaults to DRAFT */
  status?: AssignmentStatus;
  /** Whether navigation to steps other than basic-info should be disabled */
  disabled?: boolean;
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
  disabled = false,
}: StepProgressProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Optimize toggle handler
  const toggleExpand = useCallback(() => setIsExpanded((prev) => !prev), []);

  const currentStepData = useMemo(() => {
    return steps?.find((step) => step?.id === currentStep);
  }, [steps, currentStep]);

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
              isComplete={validateStep(currentStep as AssignmentStep)}
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
              {steps?.map((step) => (
                <StepButton
                  key={step.id}
                  step={step}
                  isCurrent={currentStep === step.id}
                  isComplete={validateStep(step.id)}
                  onClick={
                    disabled && !(step.id === 'basic-info' || step.id === 'assignment-preview' || step.id === 'teacher-feedback')
                      ? () => {}
                      : () => {
                          setCurrentStep(step.id);
                          setIsExpanded(false);
                        }
                  }
                  disabled={disabled}
                  status={status}
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
          {steps?.map((step) => (
            <StepButton
              key={step.id}
              step={step}
              isCurrent={currentStep === step.id}
              isComplete={validateStep(step.id)}
              onClick={
                disabled && !(step.id === 'basic-info' || step.id === 'assignment-preview' || step.id === 'teacher-feedback')
                  ? () => {}
                  : () => {
                      setCurrentStep(step.id);
                      setIsExpanded(false);
                    }
              }
              disabled={disabled}
              status={status}
            />
          ))}
        </nav>
      </div>
    </div>
  );
}