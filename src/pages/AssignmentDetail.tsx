import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { AssignmentView } from '@/components/assignments/AssignmentView';
import { ArrowLeft } from 'lucide-react';



const assignmentDrafts = (supabase: any) => supabase.from('assignment_drafts') as any;

export default function AssignmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const checkIfDraft = async () => {
      // First try to get it as a draft
      const { data: draft } = await assignmentDrafts(supabase)
        .select('*')
        .eq('id', id)
        .single();

      if (draft) {
        navigate('/app/submit', { 
          replace: true,
          state: { 
            draftId: draft.id,
            draftData: draft.data 
          }
        });
      }
    };

    checkIfDraft();
  }, [id, navigate]);

  const { data: assignment, isLoading } = useQuery({
    queryKey: ['assignment', id],
    queryFn: async () => {
      const { data: assignment } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', id)
        .single();

      if (!assignment) throw new Error('Assignment not found');
      return assignment;
    },
    retry: false
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!assignment) return null;

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Assignments
      </Button>
      <AssignmentView assignment={assignment} />
    </div>
  );
}