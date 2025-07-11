import { AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { cn } from "@/lib/utils";
import { useFormContext } from "react-hook-form";

interface FormFieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
  name?: string; // Add name prop to identify form field for validation
}

export function FormField({ 
  label, 
  hint, 
  error, 
  children, 
  required, 
  className, 
  name 
}: FormFieldProps) {
  // Get form context if available
  const formContext = useFormContext();
  const formState = formContext?.formState;
  
  // Only show error if form was submitted or validation was explicitly triggered
  const shouldShowError = error && (!formState || formState.isSubmitted || 
    (name && Object.keys(formState.errors).length > 0 && formState.errors[name]));
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <label className={cn(
          "text-lg font-medium", 
          shouldShowError ? "text-red-500" : "text-gray-900"
        )}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {hint && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <AlertCircle className="h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-lg">{hint}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className={cn(shouldShowError && "ring-1 ring-red-500 rounded-md")}>
        {children}
      </div>
      {shouldShowError && (
        <p className="text-lg text-red-500">{error}</p>
      )}
    </div>
  );
} 