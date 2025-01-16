import { useNavigate } from "react-router-dom";
import { FileText, Users, Brain, BrainCircuit, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";

interface FormHeaderProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  canNavigate?: boolean;
}

const STEPS = [
  { title: "Basic Info", icon: FileText },
  { title: "Collaboration", icon: Users },
  { title: "Process", icon: Brain },
  { title: "Reflection", icon: BrainCircuit },
  { title: "Preview", icon: CheckCircle }
];

export function FormHeader({ currentStep, onStepClick, canNavigate = false }: FormHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="border-b border-gray-100/80 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="w-full max-w-[1200px] mx-auto h-14 relative px-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/app/assignments')}
          className="text-gray-500 hover:text-gray-900 h-8 px-2 absolute left-8 top-1/2 -translate-y-1/2 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" strokeWidth={1.5} />
          <span className="text-sm font-medium">Back</span>
        </Button>
        
        <div className="w-full max-w-[800px] mx-auto h-full flex items-center justify-center">
          <div className="flex items-center gap-14">
            {STEPS.map((step, index) => {
              const stepNumber = index + 1;
              const isActive = stepNumber === currentStep;
              const isCompleted = stepNumber < currentStep;
              const isClickable = stepNumber === 1 || (canNavigate && stepNumber > 1);

              return (
                <div
                  key={step.title}
                  className={`flex items-center gap-2.5 ${
                    isClickable ? "cursor-pointer hover:text-gray-900" : "cursor-default"
                  } ${isActive ? "text-gray-900" : isClickable ? "text-gray-400" : "text-gray-300"} transition-colors duration-150`}
                  onClick={() => isClickable && onStepClick?.(stepNumber)}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
                      isActive
                        ? "bg-[#62C59F] text-white shadow-sm shadow-[#62C59F]/20 ring-4 ring-[#62C59F]/10"
                        : isCompleted && canNavigate
                        ? "bg-[#62C59F]/10 text-[#62C59F]"
                        : "bg-gray-50 text-gray-400"
                    }`}
                  >
                    {<step.icon className="w-3.5 h-3.5" strokeWidth={2} />}
                  </div>
                  <span className={`text-sm font-medium hidden md:block transition-colors`}>
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