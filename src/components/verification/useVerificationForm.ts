import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const useVerificationForm = (assignmentId: string, onVerified?: () => void) => {
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState<"approved" | "rejected" | "pending">("approved");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillsJustification, setSkillsJustification] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data: skills } = useQuery({
    queryKey: ["skills"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    }
  });

  const { data: studentSkills } = useQuery({
    queryKey: ["assignment-skills", assignmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignment_skills")
        .select("skill_id")
        .eq("assignment_id", assignmentId);
      
      if (error) throw error;
      return data.map(item => item.skill_id);
    }
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data: verification, error: verificationError } = await supabase
        .from("verifications")
        .insert({
          assignment_id: assignmentId,
          teacher_id: user.id,
          status,
          feedback,
        })
        .select()
        .single();

      if (verificationError) throw verificationError;

      const { error: assessmentError } = await supabase
        .from("teacher_assessments")
        .insert({
          verification_id: verification.id,
          selected_skills: selectedSkills,
          skills_justification: skillsJustification,
          remarks,
        });

      if (assessmentError) throw assessmentError;

      const { error: assignmentError } = await supabase
        .from("assignments")
        .update({ status })
        .eq("id", assignmentId);

      if (assignmentError) throw assignmentError;

      const { error: notificationError } = await supabase
        .functions.invoke("send-notification", {
          body: {
            type: "verification",
            assignmentId,
            recipientId: user.id,
          },
        });

      if (notificationError) {
        console.error("Failed to send notification:", notificationError);
      }

      toast({
        title: "Success!",
        description: "Verification submitted successfully.",
      });

      onVerified?.();
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        title: "Error",
        description: "Failed to submit verification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
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
  };
};