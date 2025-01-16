import { ReactNode } from "react";
import { Label } from "@/components/ui/label";

interface FormStepProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

export const FormStep = ({ label, hint, children }: FormStepProps) => {
  return (
    <div className="space-y-2.5">
      <div className="space-y-1">
        <Label className="text-sm font-medium tracking-tight text-gray-700">
          {label}
        </Label>
        {hint && (
          <p className="text-[13px] leading-normal text-gray-500/90">{hint}</p>
        )}
      </div>
      <div className="[&>*]:w-full [&>*]:transition-shadow [&>*]:duration-200">
        {children}
      </div>
    </div>
  );
};