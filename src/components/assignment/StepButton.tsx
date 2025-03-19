import { cn } from "@/lib/utils";
import { type StepConfig } from "@/types/assignment";
import { StepIndicator } from "@/components/assignment/StepIndicator";

interface StepButtonProps {
  step: StepConfig;
  isCurrent: boolean;
  isComplete: boolean;
  onClick: () => void;
}

/**
 * Reusable step button component
 */
export function StepButton({ step, isCurrent, isComplete, onClick }: StepButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors w-full text-left",
        isCurrent 
          ? "bg-blue-50 border border-blue-100" 
          : "hover:bg-slate-50 border border-transparent"
      )}
      aria-current={isCurrent ? "step" : undefined}
    >
      <StepIndicator isComplete={isComplete} isCurrent={isCurrent} />
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
}