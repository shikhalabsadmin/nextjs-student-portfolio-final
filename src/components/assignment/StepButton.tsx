import { cn } from "@/lib/utils";
import { type StepConfig } from "@/types/assignment";
import { StepIndicator } from "@/components/assignment/StepIndicator";

interface StepButtonProps {
  step: StepConfig;
  isCurrent: boolean;
  isComplete: boolean;
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Reusable step button component
 */
export function StepButton({ 
  step, 
  isCurrent, 
  isComplete, 
  onClick,
  disabled = false 
}: StepButtonProps) {
  // Disable all steps except the first one (basic-info) when disabled is true
  const isDisabled = disabled && step.id !== 'basic-info';
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors w-full text-left",
        isCurrent 
          ? "bg-blue-50 border border-blue-100" 
          : "hover:bg-slate-50 border border-transparent",
        isDisabled && "opacity-50 cursor-not-allowed"
      )}
      aria-current={isCurrent ? "step" : undefined}
      aria-disabled={isDisabled}
      disabled={isDisabled}
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