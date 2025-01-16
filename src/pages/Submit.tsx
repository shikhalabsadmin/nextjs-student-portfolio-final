import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ProgressiveForm } from "@/components/ProgressiveForm";
import { FormLayout } from "@/components/layouts/FormLayout";

export default function Submit() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [canNavigate, setCanNavigate] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/auth/login');
          return;
        }
        setIsLoading(false);
      } catch (error) {
        console.error('[Submit/checkAuth] Error:', error);
        toast({
          description: "An error occurred. Please try again.",
          variant: "destructive",
        });
      }
    };

    checkAuth();
  }, []);

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  const handleFormComplete = (isComplete: boolean) => {
    setCanNavigate(isComplete);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

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