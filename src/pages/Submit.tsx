import { useState } from "react";
import { ProgressiveForm } from "@/components/ProgressiveForm";
import { FormLayout } from "@/components/layouts/FormLayout";

export default function Submit() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [canNavigate, setCanNavigate] = useState<boolean>(false);


  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  const handleFormComplete = (isComplete: boolean) => {
    setCanNavigate(isComplete);
  };


  return (
    <FormLayout currentStep={currentStep} onStepClick={handleStepChange} canNavigate={canNavigate}>
      <ProgressiveForm 
        currentStep={currentStep} 
        onStepChange={handleStepChange}
        onFirstStepComplete={handleFormComplete}
      />
    </FormLayout>
  );
}