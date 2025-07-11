import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

// Custom StepProgress component for the sidebar
const SidebarStepProgress = ({ percentage }: { percentage: number }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-medium text-slate-600">Progress</span>
        <span className="text-xs font-medium text-slate-900">{percentage}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div 
          className="bg-indigo-500 h-2 rounded-full transition-all duration-300 ease-in-out" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

// Custom StepIndicator component for the sidebar
const SidebarStepIndicator = ({ 
  stepNumber, 
  isActive, 
  isCompleted,
  size = "md"
}: { 
  stepNumber: number; 
  isActive: boolean; 
  isCompleted: boolean;
  size?: "sm" | "md";
}) => {
  const dimensions = size === "sm" ? "h-6 w-6 text-xs" : "h-7 w-7 text-sm";
  
  if (isCompleted) {
    return (
      <div 
        className={cn(
          "rounded-full bg-green-500 flex items-center justify-center text-white flex-shrink-0",
          dimensions
        )}
        aria-label="Completed step"
      >
        <Check className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
      </div>
    );
  }
  
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center flex-shrink-0",
        dimensions,
        isActive 
          ? "bg-indigo-500 text-white" 
          : "border border-slate-300 text-slate-500"
      )}
      aria-label={isActive ? "Current step" : "Incomplete step"}
    >
      {stepNumber}
    </div>
  );
};

// Custom StepHeader component for the sidebar
const SidebarStepHeader = ({ 
  title, 
  isActive, 
  isCompleted,
  className = "" 
}: { 
  title: string; 
  isActive: boolean; 
  isCompleted: boolean;
  className?: string;
}) => {
  return (
    <div className={cn("flex flex-col", className)}>
      <span 
        className={cn(
          "text-sm font-medium",
          isActive ? "text-indigo-600" : isCompleted ? "text-green-600" : "text-slate-700"
        )}
      >
        {title}
      </span>
    </div>
  );
};

interface TeacherSidebarProps {
  steps: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
  activeStep: number;
  onStepChange: (step: number) => void;
  onBack: () => void;
  showBackButton?: boolean;
}

const TeacherSidebar = ({
  steps,
  activeStep,
  onStepChange,
  onBack,
  showBackButton = true,
}: TeacherSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    const completedSteps = steps.filter((step) => step.completed).length;
    return Math.round((completedSteps / steps.length) * 100);
  }, [steps]);

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    
    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  // Auto-collapse on mobile
  useEffect(() => {
    setIsCollapsed(isMobile);
  }, [isMobile]);

  // Toggle sidebar collapse state
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out ${
      isCollapsed ? "w-[60px] sm:w-[70px]" : "w-[280px] sm:w-[320px]"
    }`}>
      {/* Header with collapse toggle */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-200">
        {!isCollapsed && (
          <h3 className="text-sm sm:text-base font-medium text-slate-900 truncate">
            Assignment Progress
          </h3>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapse}
          className={`p-1 sm:p-2 h-auto ${isCollapsed ? "mx-auto" : ""}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform ${isCollapsed ? "rotate-180" : ""}`}
          >
            {isCollapsed ? (
              <polyline points="9 18 15 12 9 6" />
            ) : (
              <polyline points="15 18 9 12 15 6" />
            )}
          </svg>
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {!isCollapsed && (
          <div className="p-3 sm:p-4">
            <SidebarStepProgress percentage={completionPercentage} />
          </div>
        )}

        {/* Steps */}
        <div className={`flex flex-col ${isCollapsed ? "items-center pt-3" : "px-3 sm:px-4 pt-2"}`}>
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center mb-3 sm:mb-4 ${
                isCollapsed ? "justify-center" : "w-full"
              }`}
            >
              <div
                className={`flex items-center cursor-pointer ${
                  isCollapsed ? "" : "w-full"
                }`}
                onClick={() => onStepChange(index)}
              >
                <SidebarStepIndicator
                  stepNumber={index + 1}
                  isActive={activeStep === index}
                  isCompleted={step.completed}
                  size={isCollapsed ? "sm" : "md"}
                />
                
                {!isCollapsed && (
                  <SidebarStepHeader
                    title={step.title}
                    isActive={activeStep === index}
                    isCompleted={step.completed}
                    className="ml-3"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer with back button */}
      {showBackButton && (
        <div className={`p-3 sm:p-4 border-t border-slate-200 ${
          isCollapsed ? "flex justify-center" : ""
        }`}>
          <Button
            variant="outline"
            onClick={onBack}
            className={`text-xs sm:text-sm ${
              isCollapsed ? "w-auto p-2" : "w-full"
            }`}
          >
            {isCollapsed ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
            ) : (
              "Back to Assignments"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default TeacherSidebar;
