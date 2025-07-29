import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AssignmentView } from '@/components/assignments/AssignmentView';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Assignment } from '@/types/assignments';
import { Database } from '@/types/supabase';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from '@/components/RichTextEditor';
import { CheckIcon } from 'lucide-react';

interface VerificationFormData {
  meetsRequirements: boolean;
  isOriginalWork: boolean;
  hasAppropriateEvidence: boolean;
  feedback: {
    comment: string;
    suggestions: string[];
  };
}

export function AssignmentVerificationView() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>(['']);
  const [verificationChecks, setVerificationChecks] = useState({
    meetsRequirements: false,
    isOriginalWork: false,
    hasAppropriateEvidence: false
  });

  const { data: assignment, isLoading } = useQuery<Assignment>({
    queryKey: ['assignment', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          subject,
          grade,
          description,
          status,
          artifact_url,
          artifact_type,
          is_team_work,
          team_contribution,
          is_original_work,
          originality_explanation,
          month,
          selected_skills,
          skills_justification,
          pride_reason,
          creation_process,
          learnings,
          challenges,
          improvements,
          acknowledgments,
          submitted_at,
          verified_at,
          feedback,
          created_at,
          updated_at,
          student_id,
          teacher_id,
          revision_history,
          current_revision,
          student:student_id (
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
      
      // Transform the response to match the Assignment type
      const transformedData = {
        ...data,
        student: data.student[0], // Convert array to single object
        files: data.files // Keep files array as is
      };
      
      return transformedData as Assignment;
    }
  });

  const handleVerificationSubmit = async (status: 'VERIFIED' | 'NEEDS_REVISION') => {
    if (!assignment || isSubmitting) return;

    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('assignments')
        .update({
          status,
          feedback: {
            comment: feedback,
            suggestions: suggestions.filter(s => s.trim()),
            verification: verificationChecks
          },
          verified_at: new Date().toISOString()
        })
        .eq('id', assignment.id);

      if (error) throw error;

      toast({
        title: status === 'VERIFIED' ? 'Assignment Verified' : 'Revision Requested',
        description: status === 'VERIFIED' 
          ? 'The assignment has been verified successfully.'
          : 'The student will be notified to revise their work.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update assignment status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!assignment) return <div>Assignment not found</div>;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Accordion type="single" collapsible defaultValue="submission">
        <AccordionItem value="submission">
          <AccordionTrigger>Student Submission</AccordionTrigger>
          <AccordionContent>
            <AssignmentView assignment={assignment} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="verification">
          <AccordionTrigger>Verification Form</AccordionTrigger>
          <AccordionContent>
            <Card className="p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Verification Checklist</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="meetsRequirements"
                      checked={verificationChecks.meetsRequirements}
                      onCheckedChange={(checked) => 
                        setVerificationChecks(prev => ({
                          ...prev,
                          meetsRequirements: checked as boolean
                        }))
                      }
                    />
                    <Label htmlFor="meetsRequirements">
                      Meets all assignment requirements
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isOriginalWork"
                      checked={verificationChecks.isOriginalWork}
                      onCheckedChange={(checked) => 
                        setVerificationChecks(prev => ({
                          ...prev,
                          isOriginalWork: checked as boolean
                        }))
                      }
                    />
                    <Label htmlFor="isOriginalWork">
                      Work appears to be original/properly cited
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasAppropriateEvidence"
                      checked={verificationChecks.hasAppropriateEvidence}
                      onCheckedChange={(checked) => 
                        setVerificationChecks(prev => ({
                          ...prev,
                          hasAppropriateEvidence: checked as boolean
                        }))
                      }
                    />
                    <Label htmlFor="hasAppropriateEvidence">
                      Includes appropriate evidence/artifacts
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Feedback</h3>
                
                <div>
                  <Label>Comments</Label>
                  <RichTextEditor
                    value={feedback}
                    onChange={setFeedback}
                    placeholder="Provide feedback on the assignment..."
                  />
                </div>

                <div>
                  <Label>Suggestions for Improvement</Label>
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="flex gap-2 mt-2">
                      <div className="flex-1">
                        <RichTextEditor
                          value={suggestion}
                          onChange={(value) => {
                            const newSuggestions = [...suggestions];
                            newSuggestions[index] = value;
                            setSuggestions(newSuggestions);
                          }}
                          placeholder="Add a suggestion..."
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const newSuggestions = suggestions.filter((_, i) => i !== index);
                          setSuggestions(newSuggestions.length ? newSuggestions : ['']);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSuggestions([...suggestions, ''])}
                    className="mt-2"
                  >
                    Add Suggestion
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleVerificationSubmit('NEEDS_REVISION')}
                  disabled={isSubmitting}
                >
                  Request Revision
                </Button>
                <Button
                  onClick={() => handleVerificationSubmit('VERIFIED')}
                  disabled={
                    isSubmitting || 
                    !Object.values(verificationChecks).every(Boolean) ||
                    !feedback.trim()
                  }
                >
                  Verify Assignment
                </Button>
              </div>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
} 