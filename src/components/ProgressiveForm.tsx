import { useState } from "react";
import { Card } from "@/components/ui/card";
import { FormProgress } from "./assignment-form/FormProgress";
import { FormStep } from "./assignment-form/FormStep";
import { FormNavigation } from "./assignment-form/FormNavigation";
import { QuestionField } from "./assignment-form/QuestionField";
import { INITIAL_QUESTIONS } from "./assignment-form/QuestionTypes";
import { useAssignmentSubmission } from "./assignment-form/useAssignmentSubmission";
import { toast } from "sonner";
import { assignmentSchema, type AssignmentFormData } from "@/lib/validations/assignment";

export const ProgressiveForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<AssignmentFormData>>({});
  const { isSubmitting, handleSubmit } = useAssignmentSubmission();

  const validateCurrentStep = () => {
    const currentQuestion = INITIAL_QUESTIONS[currentStep];
    if (!currentQuestion.required) return true;

    try {
      const fieldSchema = assignmentSchema.shape[currentQuestion.id as keyof AssignmentFormData];
      if (!fieldSchema) return true;
      
      fieldSchema.parse(answers[currentQuestion.id as keyof AssignmentFormData]);
      return true;
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
      return false;
    }
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    if (currentStep < INITIAL_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      try {
        const validatedData = assignmentSchema.parse(answers);
        const success = await handleSubmit(validatedData);
        if (success) {
          toast.success("Assignment submitted successfully!");
          setAnswers({});
          setCurrentStep(0);
        }
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        }
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentQuestion = INITIAL_QUESTIONS[currentStep];
  const shouldShowQuestion = !currentQuestion.condition || currentQuestion.condition(answers);

  if (!shouldShowQuestion) {
    handleNext();
    return null;
  }

  return (
    <Card className="w-full max-w-2xl p-8 bg-white shadow-sm">
      <FormProgress 
        currentStep={currentStep} 
        totalSteps={INITIAL_QUESTIONS.length} 
      />

      <FormStep
        label={currentQuestion.label}
        hint={currentQuestion.hint}
      >
        <QuestionField
          question={currentQuestion}
          value={answers[currentQuestion.id as keyof AssignmentFormData]}
          onChange={(value) => setAnswers({ ...answers, [currentQuestion.id]: value })}
        />
      </FormStep>

      <FormNavigation
        currentStep={currentStep}
        totalSteps={INITIAL_QUESTIONS.length}
        isSubmitting={isSubmitting}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />

      {currentStep < INITIAL_QUESTIONS.length - 1 && (
        <div className="mt-4 text-center">
          <button 
            className="text-sm text-gray-500 hover:text-gray-700"
            onClick={() => toast.info("Progress saved")}
          >
            Save as Draft
          </button>
        </div>
      )}
    </Card>
  );
};