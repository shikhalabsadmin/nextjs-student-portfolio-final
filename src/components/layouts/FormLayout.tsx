import { FormHeader } from "./FormHeader";

interface FormLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  onStepClick?: (step: number) => void;
  canNavigate?: boolean;
}

export function FormLayout({ children, currentStep, onStepClick, canNavigate }: FormLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white/95">
      <FormHeader currentStep={currentStep} onStepClick={onStepClick} canNavigate={canNavigate} />
      <main className="w-full max-w-[800px] mx-auto px-8 pt-6 pb-12">
        {children}
      </main>
    </div>
  );
} 