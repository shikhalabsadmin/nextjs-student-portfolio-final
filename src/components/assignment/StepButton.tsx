import { cn } from "@/lib/utils";
import { type StepConfig } from "@/types/assignment";
import { StepIndicator } from "@/components/assignment/StepIndicator";
import { ASSIGNMENT_STATUS, type AssignmentStatus } from "@/constants/assignment-status";

interface StepButtonProps {
  step: StepConfig;
  isCurrent: boolean;
  isComplete: boolean;
  onClick: () => void;
  disabled?: boolean;
  status?: AssignmentStatus;
}

/**
 * Reusable step button component
 */
export function StepButton({ 
  step, 
  isCurrent, 
  isComplete, 
  onClick,
  disabled = false,
  status = ASSIGNMENT_STATUS.DRAFT
}: StepButtonProps) {
  // For submitted/approved assignments, only allow clicking on preview and feedback steps
  let isDisabled = false;
  
  if (status === ASSIGNMENT_STATUS.SUBMITTED || status === ASSIGNMENT_STATUS.APPROVED) {
    // For submitted assignments: only assignment-preview and teacher-feedback are clickable
    isDisabled = !(step.id === 'assignment-preview' || step.id === 'teacher-feedback');
  } else {
    // For draft assignments: standard disabled logic
    isDisabled = disabled && step.id !== 'basic-info';
  }

  const handleClick = () => {
    if (!isDisabled) {
      onClick();
    }
  };
  
  return (
    <button
      onClick={handleClick}
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