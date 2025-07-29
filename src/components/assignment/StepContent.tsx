import { type UseFormReturn } from "react-hook-form";
import { type AssignmentFormValues } from "@/lib/validations/assignment";
import { type AssignmentStep } from "@/types/assignment";
import { ASSIGNMENT_STATUS } from "@/constants/assignment-status";
import { createContext, useContext, lazy, Suspense } from "react";
import { Loading } from "@/components/ui/loading";
import { StepFooter } from "./StepFooter";

// Lazy load all step components
const BasicInfoStep = lazy(() => import("@/components/assignment/steps/BasicInfoStep").then(mod => ({ default: mod.BasicInfoStep })));
const CollaborationStep = lazy(() => import("@/components/assignment/steps/CollaborationStep").then(mod => ({ default: mod.CollaborationStep })));
const ProcessStep = lazy(() => import("@/components/assignment/steps/ProcessStep").then(mod => ({ default: mod.ProcessStep })));
const ReflectionStep = lazy(() => import("@/components/assignment/steps/ReflectionStep").then(mod => ({ default: mod.ReflectionStep })));
const PreviewStep = lazy(() => import("@/components/assignment/steps/PreviewStep").then(mod => ({ default: mod.PreviewStep })));
const TeacherFeedbackStep = lazy(() => import("@/components/assignment/steps/TeacherFeedbackStep").then(mod => ({ default: mod.TeacherFeedbackStep })));

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
  onContinue: () => void;
  disabled: boolean;
  areAllStepsComplete?: boolean;
};

export function StepContent({ step, form, onContinue, disabled, areAllStepsComplete }: StepContentProps) {
  // Check if the assignment is in SUBMITTED status and should be readonly
  const assignmentStatus = form.getValues().status;
  const isReadOnly = assignmentStatus === ASSIGNMENT_STATUS.SUBMITTED;

  return (
    <FormStateContext.Provider value={{ readonly: isReadOnly }}>
      <div className={isReadOnly ? "opacity-90 pointer-events-none" : ""}>
        <Suspense fallback={<Loading text="Loading step..." />}>
          {renderStepContent(step, form)}
        </Suspense>
        
        {/* Add StepFooter at the bottom of each step */}
        {!isReadOnly && (
          <StepFooter
            step={step}
            onContinue={onContinue}
            disabled={disabled}
            areAllStepsComplete={areAllStepsComplete}
          />
        )}
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