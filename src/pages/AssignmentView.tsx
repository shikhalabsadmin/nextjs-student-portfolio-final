import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Assignment } from '@/types/assignments';
import { AssignmentDetails } from '@/components/assignments/AssignmentDetails';

export default function AssignmentView() {
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
            ),
            files:assignment_files (
              id,
              file_url,
              file_name,
              file_size,
              file_type,
              created_at
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        console.log('[DEBUG] Student View - Assignment Data:', {
          id: data.id,
          artifact_url: data.artifact_url,
          files: data.files,
          filesCount: data.files?.length
        });
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Assignment Details</h1>
        <AssignmentDetails assignment={assignment} mode="student" />
      </div>
    </div>
  );
} 