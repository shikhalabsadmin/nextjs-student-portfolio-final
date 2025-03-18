import { type UseFormReturn } from "react-hook-form";
import { type AssignmentFormValues } from "@/lib/validations/assignment";
import { type AssignmentStep } from "@/types/assignment";
import { BasicInfoStep } from "@/components/assignment/steps/BasicInfoStep";
import { CollaborationStep } from "@/components/assignment/steps/CollaborationStep";
import { ProcessStep } from "@/components/assignment/steps/ProcessStep";
import { ReflectionStep } from "@/components/assignment/steps/ReflectionStep";
import { PreviewStep } from "@/components/assignment/steps/PreviewStep";
import { TeacherFeedbackStep } from "@/components/assignment/steps/TeacherFeedbackStep";

type StepContentProps = {
  step: AssignmentStep;
  form: UseFormReturn<AssignmentFormValues>;
};

export function StepContent({ step, form }: StepContentProps) {
  switch (step) {
    case "basic-info":
      return <BasicInfoStep form={form} />;
    case "role-originality":
      return <CollaborationStep form={form} />;
    case "skills-reflection":
      return <ProcessStep form={form} />;
    case "process-challenges":
      return <ReflectionStep form={form} />;
    case "review-submit":
      return <PreviewStep form={form} />;
    case "teacher-feedback":
      return <TeacherFeedbackStep form={form} />;
    default:
      return null;
  }
} 