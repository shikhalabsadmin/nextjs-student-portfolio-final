import { cn } from "@/lib/utils";
import type { StepConfig, AssignmentStep } from "@/types/assignment";
import { LucideIcon } from "lucide-react";

interface StepperProps {
  steps: StepConfig[];
  currentStep: AssignmentStep;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <header className="border-b border-gray-100/80 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="w-full max-w-[1200px] mx-auto h-14 relative px-8">
        <div className="w-full max-w-[800px] mx-auto h-full flex items-center justify-center">
          <div className="flex items-center gap-14">
            {steps.map((step) => {
              const isActive = step.id === currentStep;
              const isCompleted = steps.findIndex(s => s.id === currentStep) > steps.findIndex(s => s.id === step.id);
              const Icon = step.icon as LucideIcon;

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-2.5 transition-colors duration-150",
                    isActive ? "text-gray-900" : "text-gray-400"
                  )}
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200",
                      isActive
                        ? "bg-[#62C59F] text-white shadow-sm shadow-[#62C59F]/20 ring-4 ring-[#62C59F]/10"
                        : isCompleted
                        ? "bg-[#62C59F]/10 text-[#62C59F]"
                        : "bg-gray-50 text-gray-400"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                  </div>
                  <span className="text-sm font-medium hidden md:block transition-colors">
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
} 