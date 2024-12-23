import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

interface FormNavigationProps {
  currentStep: number;
  totalSteps: number;
  isSubmitting: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export const FormNavigation = ({
  currentStep,
  totalSteps,
  isSubmitting,
  onPrevious,
  onNext,
}: FormNavigationProps) => {
  return (
    <div className="flex justify-between mt-8 pt-6 border-t">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 0 || isSubmitting}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Previous
      </Button>
      <Button 
        onClick={onNext}
        disabled={isSubmitting}
        className="flex items-center gap-2 bg-[#62C59F] hover:bg-[#62C59F]/90"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            {currentStep === totalSteps - 1 ? (
              "Submit"
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </>
        )}
      </Button>
    </div>
  );
};