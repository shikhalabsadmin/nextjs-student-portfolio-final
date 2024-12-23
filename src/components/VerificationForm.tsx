import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { StatusSection } from "./verification/StatusSection";
import { SkillsSection } from "./verification/SkillsSection";
import { FeedbackSection } from "./verification/FeedbackSection";
import { useVerificationForm } from "./verification/useVerificationForm";
import { useToast } from "@/hooks/use-toast";

interface VerificationFormProps {
  assignmentId: string;
  onVerified?: () => void;
}

export const VerificationForm = ({ assignmentId, onVerified }: VerificationFormProps) => {
  const { toast } = useToast();
  
  const {
    status,
    setStatus,
    feedback,
    setFeedback,
    selectedSkills,
    setSelectedSkills,
    skillsJustification,
    setSkillsJustification,
    remarks,
    setRemarks,
    isSubmitting,
    handleSubmit,
    skills,
    studentSkills,
  } = useVerificationForm(assignmentId, () => {
    toast({
      title: "Verification submitted successfully",
      description: "The assignment has been verified.",
      duration: 3000,
    });
    onVerified?.();
  });

  const getStatusIcon = () => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <Card className="p-6 bg-white shadow-sm border border-gray-200">
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Assignment Verification</h2>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium capitalize">{status}</span>
          </div>
        </div>

        <StatusSection 
          status={status} 
          setStatus={setStatus} 
        />
        
        <SkillsSection
          skills={skills}
          studentSkills={studentSkills}
          selectedSkills={selectedSkills}
          setSelectedSkills={setSelectedSkills}
        />

        <FeedbackSection
          feedback={feedback}
          setFeedback={setFeedback}
          skillsJustification={skillsJustification}
          setSkillsJustification={setSkillsJustification}
          remarks={remarks}
          setRemarks={setRemarks}
        />

        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-[#62C59F] hover:bg-[#62C59F]/90 text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting Verification...
            </>
          ) : (
            "Submit Verification"
          )}
        </Button>
      </div>
    </Card>
  );
};