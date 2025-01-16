import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DbClient } from '@/types/supabase';
import { useToast } from '@/components/ui/use-toast';
import type { AssignmentFormData } from '@/types/assignments';

interface UseAssignmentSubmissionProps {
  studentId: string;
  onSuccess: () => void;
}

export function useAssignmentSubmission({
  studentId,
  onSuccess,
}: UseAssignmentSubmissionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const submitAssignment = async (data: AssignmentFormData, status: 'DRAFT' | 'SUBMITTED') => {
    setIsSubmitting(true);
    try {
      // Create or update the assignment
      const assignmentData = {
        student_id: studentId,
        title: data.title,
        subject: data.subject,
        grade: data.grade,
        status,
        artifact_url: data.artifact_url,
        artifact_type: data.artifact_type,
        is_team_work: data.is_team_work || false,
        team_contribution: data.team_contribution || null,
        is_original_work: data.is_original_work || true,
        originality_explanation: data.originality_explanation || null,
        month: data.month || new Date().toLocaleString('default', { month: 'long' }),
        selected_skills: data.selected_skills || [],
        skills_justification: data.skills_justification || null,
        pride_reason: data.pride_reason || null,
        creation_process: data.creation_process || null,
        learnings: data.learnings || null,
        challenges: data.challenges || null,
        improvements: data.improvements || null,
        acknowledgments: data.acknowledgments || null,
        teacher_id: data.teacher_id || null,
        submitted_at: status === 'SUBMITTED' ? new Date().toISOString() : null,
        verified_at: null,
        feedback: null,
        revision_history: [],
        current_revision: 0
      };

      console.debug('[DEBUG] Saving assignment data:', {
        assignmentData,
        existingId: data.id,
        status
      });

      if (data.id) {
        // Update existing assignment
        const { error: updateError } = await supabase
          .from('assignments')
          .update(assignmentData)
          .eq('id', data.id);

        if (updateError) throw updateError;
      } else {
        // Create new assignment
        const { data: assignment, error: createError } = await supabase
          .from('assignments')
          .insert(assignmentData)
          .select()
          .single();

        if (createError) throw createError;
      }

      onSuccess();
    } catch (error) {
      console.error('Error submitting assignment:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveDraft = async (data: AssignmentFormData) => {
    await submitAssignment(data, 'DRAFT');
  };

  const submitWork = async (data: AssignmentFormData) => {
    await submitAssignment(data, 'SUBMITTED');
  };

  return {
    isSubmitting,
    saveDraft,
    submitWork,
  };
}