import { useAssignmentForm } from "@/hooks/useAssignmentForm";
import { STEPS } from "@/lib/config/steps";
import { Button } from "@/components/ui/button";
import { BasicInfoStep } from "@/components/assignment/steps/BasicInfoStep";
import { CollaborationStep } from "@/components/assignment/steps/CollaborationStep";
import { ProcessStep } from "@/components/assignment/steps/ProcessStep";
import { ReflectionStep } from "@/components/assignment/steps/ReflectionStep";
import { PreviewStep } from "@/components/assignment/steps/PreviewStep";
import { TeacherFeedbackStep } from "@/components/assignment/steps/TeacherFeedbackStep";
import { Form } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { User } from "@supabase/supabase-js";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function AssignmentForm({ user }: { user: User }) {
  const {
    form,
    currentStep,
    setCurrentStep,
    nextStep,
    onSubmit,
    isLoading,
    isCurrentStepComplete,
    validateStep,
  } = useAssignmentForm({
    user: user,
  });

  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const getCurrentStep = () => {
    switch (currentStep) {
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
    }
  };

  const currentStepConfig = STEPS.find((step) => step.id === currentStep);

  const handleSaveAndContinue = () => {
    // Force mark the current step as visited to ensure validation works
    const formData = form.getValues();
    
    // Log validation state for debugging
    console.log("Form validation:", {
      currentStep,
      formData,
      isComplete: isCurrentStepComplete()
    });
    
    if (!isCurrentStepComplete()) {
      return;
    }

    // If we're on the review page, show confirmation modal
    if (currentStep === "review-submit") {
      setShowConfirmationModal(true);
      return;
    }
    
    onSubmit();
    nextStep();
  };

  const handleConfirmSubmit = () => {
    onSubmit();
    nextStep();
    setShowConfirmationModal(false);
  };

  return (
    <div className="flex gap-8 container my-10">
      {/* Left Sidebar - Progress */}
      <div className="w-80 h-max border-2 border-slate-200 rounded-md">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-base font-medium text-gray-900">Your Progress</h2>
        </div>
        <div className="space-y-2.5 px-4 py-6">
          {STEPS.map((step) => {
            const isCurrent = currentStep === step.id;
            const formData = form.getValues();
            const isComplete = validateStep(step.id, formData);

            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 transition-colors w-full text-left",
                  isCurrent ? "bg-blue-50" : "hover:bg-gray-50"
                )}
              >
                <div
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    isCurrent
                      ? "bg-blue-500"
                      : isComplete
                      ? "bg-green-500"
                      : "border-2 border-gray-300"
                  )}
                />
                <span
                  className={cn(
                    "text-sm",
                    isCurrent ? "font-medium text-gray-900" : "text-gray-500"
                  )}
                >
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content - Form */}
      <div className="mx-auto container">
        <Form {...form}>
          <form
            onSubmit={onSubmit}
            className="rounded-md border border-gray-200 space-y-0 flex flex-col h-[calc(100vh-8rem)] overflow-hidden"
          >
            {currentStepConfig && (
              <div className="sticky top-0 z-10 flex justify-between items-center border-b border-gray-200 p-5 bg-white">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    {currentStepConfig.header}
                  </h2>
                  <p className="text-gray-600">
                    {currentStepConfig.description}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleSaveAndContinue}
                  disabled={isLoading || !isCurrentStepComplete()}
                  className="bg-[#6366F1] hover:bg-[#6366F1]/90 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
                >
                  Save & Continue
                </Button>
              </div>
            )}
            <section className="p-5 flex-1 overflow-y-auto">{getCurrentStep()}</section>
          </form>
        </Form>

        {/* Confirmation Modal */}
        <Dialog open={showConfirmationModal} onOpenChange={() => setShowConfirmationModal(false)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ready to Submit Your Artifact?</DialogTitle>
              <DialogDescription>
                Once submitted, you won't be able to make any changes unless your teacher requests revisions. Are you sure you want to proceed?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowConfirmationModal(false)}>
                Cancel
              </Button>
              <Button 
                className="bg-[#6366F1] hover:bg-[#6366F1]/90 text-white" 
                onClick={handleConfirmSubmit}
              >
                Confirm & Submit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default AssignmentForm;
