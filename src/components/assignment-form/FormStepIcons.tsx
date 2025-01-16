import { FileText, Users, Brain, BrainCircuit, CheckCircle } from "lucide-react";

interface FormStepIconsProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const STEPS = [
  {
    title: "Basic Information",
    icon: FileText,
    description: "Title, subject, and files"
  },
  {
    title: "Collaboration & Originality",
    icon: Users,
    description: "Team work and originality"
  },
  {
    title: "Skills & Process",
    icon: Brain,
    description: "Skills and creation process"
  },
  {
    title: "Reflection",
    icon: BrainCircuit,
    description: "Learning and improvements"
  },
  {
    title: "Preview",
    icon: CheckCircle,
    description: "Review and submit"
  }
];

export const FormStepIcons = ({ currentStep, onStepClick }: FormStepIconsProps) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between">
        {STEPS.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          const isClickable = stepNumber <= currentStep && onStepClick;

          return (
            <div
              key={step.title}
              className={`flex flex-col items-center space-y-2 ${
                isClickable ? "cursor-pointer" : "cursor-default"
              }`}
              onClick={() => isClickable && onStepClick(stepNumber)}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isActive
                    ? "bg-[#62C59F] text-white"
                    : isCompleted
                    ? "bg-[#62C59F]/20 text-[#62C59F]"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {<step.icon className="w-6 h-6" />}
              </div>
              <span className={`text-sm font-medium ${
                isActive || isCompleted ? "text-gray-900" : "text-gray-400"
              }`}>
                {step.title}
              </span>
              <span className="text-xs text-gray-500 text-center max-w-[120px]">
                {step.description}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 