import { type UseFormReturn } from "react-hook-form";
import { type AssignmentFormValues } from "@/lib/validations/assignment";
import { type AssignmentStep } from "@/types/assignment";
import { BasicInfoStep } from "@/components/assignment/steps/BasicInfoStep";
import { CollaborationStep } from "@/components/assignment/steps/CollaborationStep";
import { ProcessStep } from "@/components/assignment/steps/ProcessStep";
import { ReflectionStep } from "@/components/assignment/steps/ReflectionStep";
import { PreviewStep } from "@/components/assignment/steps/PreviewStep";
import { TeacherFeedbackStep } from "@/components/assignment/steps/TeacherFeedbackStep";
import { ASSIGNMENT_STATUS } from "@/constants/assignment-status";
import { createContext, useContext } from "react";

// Create a context to provide the readonly state to all form components
type FormStateContextType = {
  readonly: boolean;
};

const FormStateContext = createContext<FormStateContextType>({ readonly: false });

// Hook to access the form state context
export const useFormState = () => useContext(FormStateContext);

type StepContentProps = {
  step: AssignmentStep;
  form: UseFormReturn<AssignmentFormValues>;
};

export function StepContent({ step, form }: StepContentProps) {
  // Check if the assignment is in SUBMITTED status and should be readonly
  const assignmentStatus = form.getValues().status;
  const isReadOnly = assignmentStatus === ASSIGNMENT_STATUS.SUBMITTED;

  return (
    <FormStateContext.Provider value={{ readonly: isReadOnly }}>
      <div className={isReadOnly ? "opacity-90 pointer-events-none" : ""}>
        {renderStepContent(step, form)}
      </div>
    </FormStateContext.Provider>
  );
}

// Helper function to render the appropriate step component
function renderStepContent(step: AssignmentStep, form: UseFormReturn<AssignmentFormValues>) {
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