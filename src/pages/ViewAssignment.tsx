import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AssignmentView } from '@/components/assignment-form/AssignmentView';
import { useToast } from '@/components/ui/use-toast';
import type { Assignment } from '@/types/assignments';

export default function ViewAssignment() {
  const { id } = useParams();
  const { toast } = useToast();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAssignment() {
      try {
        const { data, error } = await supabase
          .from('assignments')
          .select(`
            *,
            student:profiles!student_id (
              id,
              full_name,
              grade
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setAssignment(data);
      } catch (error) {
        console.error('Error fetching assignment:', error);
        toast({
          title: 'Error',
          description: 'Failed to load assignment details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchAssignment();
  }, [id, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Assignment Not Found</h1>
          <p className="text-gray-600 mt-2">The assignment you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return <AssignmentView assignment={assignment} />;
} 