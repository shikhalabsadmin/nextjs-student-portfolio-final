import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useAssignmentSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('assignments')
      .upload(filePath, file);

    if (uploadError) {
      toast({
        title: "Error",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('assignments')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (answers: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      let artifactUrl = null;
      if (answers.artifact) {
        artifactUrl = await handleFileUpload(answers.artifact);
      }

      const { error: assignmentError, data: assignment } = await supabase
        .from('assignments')
        .insert({
          student_id: user.id,
          title: answers.title,
          artifact_type: answers.type,
          subject: answers.subject,
          month: answers.month,
          is_team_project: answers.is_team_project || false,
          is_original_work: answers.is_original_work || false,
          artifact_url: artifactUrl,
          status: 'submitted',
        })
        .select()
        .single();

      if (assignmentError) throw assignmentError;

      // Insert responses
      const responses = [
        { question_key: 'team_description', response_text: answers.team_description },
        { question_key: 'originality_description', response_text: answers.originality_description },
        { question_key: 'description', response_text: answers.description },
      ].filter(r => r.response_text);

      if (responses.length > 0) {
        const { error: responsesError } = await supabase
          .from('responses')
          .insert(responses.map(r => ({
            assignment_id: assignment.id,
            ...r,
          })));

        if (responsesError) throw responsesError;
      }

      toast({
        title: "Success!",
        description: "Your work has been submitted for review.",
      });

      return true;
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Error",
        description: "Failed to submit your work. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handleSubmit,
  };
};