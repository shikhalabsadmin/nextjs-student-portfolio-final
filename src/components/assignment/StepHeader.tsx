import { Button } from "@/components/ui/button";

type StepHeaderProps = {
  title: string;
  description: string;
  showContinueButton: boolean;
  onContinue: () => void;
  disabled: boolean;
};

export function StepHeader({
  title,
  description,
  showContinueButton,
  onContinue,
  disabled,
}: StepHeaderProps) {
  return (
    <div className="sticky top-0 z-10 flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center border-b border-gray-200 p-3 sm:p-5 bg-white">
      <div>
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">
          {title}
        </h2>
        <p className="text-gray-600 text-xs sm:text-sm md:text-base mt-1 sm:mt-2">
          {description}
        </p>
      </div>
      {showContinueButton && (
        <Button
          type="button"
          onClick={onContinue}
          disabled={disabled}
          className="mt-2 sm:mt-0 w-full sm:w-auto bg-[#6366F1] hover:bg-[#6366F1]/90 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
        >
          Save & Continue
        </Button>
      )}
    </div>
  );
} 