import { useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { AssignmentFormValues } from "@/lib/validations/assignment";
import { AssignmentStep } from "@/types/assignment";
import { BasicInfoStep } from "./steps/BasicInfoStep";
import { CollaborationStep } from "./steps/CollaborationStep";
import { ProcessStep } from "./steps/ProcessStep";
import { ReflectionStep } from "./steps/ReflectionStep";
import { SkillsReflectionStep } from "./steps/SkillsReflectionStep";
import { PreviewStep } from "./steps/PreviewStep";
import { TeacherFeedbackStep } from "./steps/TeacherFeedbackStep";

type StepContentProps = {
  step: AssignmentStep;
  form: UseFormReturn<AssignmentFormValues>;
  onContinue: () => void;
  disabled: boolean;
  areAllStepsComplete: boolean;
};

export function StepContent({ step, form, onContinue, disabled, areAllStepsComplete }: StepContentProps) {
  // Reduced logging frequency - only log on step changes, not every render
  const logKey = `${step}-${form.getValues().id}`;
  const lastLoggedRef = useRef<string>('');
  
  lastLoggedRef.current = logKey;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 p-6 pb-0 overflow-y-auto">
        {renderStepContent(step, form)}
      </div>
    </div>
  );
}

function renderStepContent(step: AssignmentStep, form: UseFormReturn<AssignmentFormValues>) {
  
  switch (step) {
    case "basic-info":
      return <BasicInfoStep form={form} />;
    case "role-originality":
      return <CollaborationStep form={form} />;
    case "skills-reflection":
      return <SkillsReflectionStep form={form} />;
    case "process-challenges":
      return <ProcessStep form={form} />;
    case "review-submit":
      return <PreviewStep form={form} />;
    case "assignment-preview":
      return <PreviewStep form={form} />;
    case "teacher-feedback":
      return <TeacherFeedbackStep form={form} />;
    default:
      console.error("Unknown step:", step);
      return <div>Unknown step: {step}</div>;
  }
} 