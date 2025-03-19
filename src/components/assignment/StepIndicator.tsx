import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  isComplete: boolean;
  isCurrent: boolean;
}

/**
 * Visual indicator for step status
 */
export function StepIndicator({ isComplete, isCurrent }: StepIndicatorProps) {
  if (isComplete) {
    return (
      <div 
        className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center text-white flex-shrink-0"
        aria-label="Completed step"
      >
        <Check className="h-3 w-3" />
      </div>
    );
  }
  
  return (
    <div
      className={cn(
        "h-5 w-5 rounded-full flex-shrink-0",
        isCurrent ? "bg-blue-500" : "border border-gray-300"
      )}
      aria-label={isCurrent ? "Current step" : "Incomplete step"}
    />
  );
}