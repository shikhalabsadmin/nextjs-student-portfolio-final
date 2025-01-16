import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Assignment } from '@/types/assignments';
import { PreviewSection, PreviewField } from '@/components/ui/preview-section';
import { FileText } from 'lucide-react';
import { SKILLS } from '@/lib/constants';

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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Assignment Details</h1>

        <PreviewSection title="Basic Information">
          <PreviewField label="Title" value={assignment.title} />
          <PreviewField label="Subject" value={assignment.subject} />
          <PreviewField label="Grade" value={assignment.grade} />
          <PreviewField label="Month" value={assignment.month} />
          <PreviewField label="Artifact Type" value={assignment.artifact_type} />
        </PreviewSection>

        <PreviewSection title="Artifact">
          {(assignment.artifact_url?.split(',') || []).filter(Boolean).map((file, index) => (
            <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-white/40">
              <FileText className="w-4 h-4 text-gray-500" />
              <a 
                href={file} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 truncate"
              >
                {file.split('/').pop()}
              </a>
            </div>
          ))}
        </PreviewSection>

        <PreviewSection title="Collaboration">
          <PreviewField 
            label="Is this a team project?" 
            value={assignment.is_team_work ? 'Yes' : 'No'} 
          />
          {assignment.is_team_work && (
            <PreviewField 
              label="What was your contribution to the team?" 
              value={assignment.team_contribution} 
            />
          )}
          <PreviewField 
            label="Is this your original work?" 
            value={assignment.is_original_work ? 'Yes' : 'No'} 
          />
          {!assignment.is_original_work && (
            <PreviewField 
              label="Please explain" 
              value={assignment.originality_explanation} 
            />
          )}
        </PreviewSection>

        <PreviewSection title="Skills & Pride">
          <PreviewField 
            label="Selected Skills" 
            value={assignment.selected_skills?.map(skill => 
              SKILLS.find(s => s.id === skill)?.name || skill
            ).join(', ')} 
          />
          <PreviewField 
            label="Skills Justification" 
            value={assignment.skills_justification} 
          />
          <PreviewField 
            label="Pride Reason" 
            value={assignment.pride_reason} 
          />
        </PreviewSection>

        <PreviewSection title="Process & Reflection">
          <PreviewField 
            label="Creation Process" 
            value={assignment.creation_process} 
          />
          <PreviewField 
            label="Learnings" 
            value={assignment.learnings} 
          />
          <PreviewField 
            label="Challenges" 
            value={assignment.challenges} 
          />
          <PreviewField 
            label="Future Improvements" 
            value={assignment.improvements} 
          />
          <PreviewField 
            label="Acknowledgments" 
            value={assignment.acknowledgments} 
          />
        </PreviewSection>
      </div>
    </div>
  );
} 