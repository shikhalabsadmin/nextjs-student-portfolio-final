import { Button } from "@/components/ui/button";
import { ASSIGNMENT_STATUS } from "@/constants/assignment-status";
import { cn } from "@/lib/utils";
import { AssignmentStep } from "@/types/assignment";

type StepHeaderProps = {
  title: string;
  description: string;
  onContinue: () => void;
  disabled: boolean;
  step: AssignmentStep;
};

export function StepHeader({
  title,
  description,
  onContinue,
  disabled,
  step,
}: StepHeaderProps) {
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
      <Button
        type="button"
        onClick={onContinue}
        disabled={disabled}
        className={cn('mt-2 sm:mt-0 w-full sm:w-auto bg-[#6366F1] hover:bg-[#6366F1]/90 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors',`${step === "teacher-feedback" ? "hidden" : ""}`)}
      >
        {step === "review-submit" ? "Submit" : "Save & Continue"}
      </Button>
    </div>
  );
}
