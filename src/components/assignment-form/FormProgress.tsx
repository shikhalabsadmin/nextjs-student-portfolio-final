import { CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface FormProgressProps {
  currentStep: number;
  totalSteps: number;
}

export const FormProgress = ({ currentStep, totalSteps }: FormProgressProps) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            Question {currentStep + 1} of {totalSteps}
          </span>
          {currentStep > 0 && (
            <CheckCircle className="w-4 h-4 text-[#62C59F]" />
          )}
        </div>
        <span className="text-sm font-medium text-gray-700">
          {Math.round(progress)}% Complete
        </span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
};