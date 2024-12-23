import { ReactNode } from "react";
import { Label } from "@/components/ui/label";

interface FormStepProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

export const FormStep = ({ label, hint, children }: FormStepProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-lg font-semibold text-gray-900">
          {label}
        </Label>
        {hint && (
          <p className="text-sm text-gray-500">{hint}</p>
        )}
      </div>
      {children}
    </div>
  );
};