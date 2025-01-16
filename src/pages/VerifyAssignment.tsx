import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, ExternalLink, CheckCircle, XCircle, ChevronDown, ChevronUp, Paperclip } from 'lucide-react';
import { MultiSelect } from '@/components/ui/multi-select';
import { Assignment } from '@/types/assignments';
import { SKILLS } from '@/lib/constants';
import { formatSubject, formatGrade } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export const VerifyAssignment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [remarks, setRemarks] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillJustification, setSkillJustification] = useState('');
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);

  const { data: assignment, isLoading } = useQuery({
    queryKey: ['assignment', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          student:profiles!student_id (
            id,
            full_name,
            grade
          ),
          responses (
            question_key,
            response_text
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      console.log('[DEBUG] Raw assignment data:', data);
      return data as unknown as Assignment;
    }
  });

  // Initialize selected skills when assignment loads
  useEffect(() => {
    console.log('[DEBUG] Assignment in useEffect:', {
      selected_skills: assignment?.selected_skills,
      assignment
    });
    if (assignment?.selected_skills) {
      console.log('[DEBUG] Setting selected skills:', assignment.selected_skills);
      setSelectedSkills(assignment.selected_skills);
    }
  }, [assignment]);

  const verifyMutation = useMutation({
    mutationFn: async (status: 'verified' | 'needs_revision') => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('verifications')
        .insert({
          assignment_id: id,
          teacher_id: user.id,
          status,
          feedback: remarks,
          verification_skills: {
            skills: selectedSkills,
            justification: skillJustification
          }
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-verify', id] });
      toast({
        title: 'Verification submitted',
        description: 'The assignment has been verified successfully.',
      });
      navigate('/app/assignments');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to submit verification. Please try again.',
        variant: 'destructive',
      });
    }
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const files = (assignment.files || []).filter(Boolean);

  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-6">
      {/* Assignment Header */}
      <Card className="p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold">{assignment.title}</h1>
            <div className="flex gap-2">
              {files.map((file, index) => (
                <Button 
                  key={index}
                  variant="outline"
                  onClick={() => window.open(file.file_url, '_blank')}
                  className="text-sm"
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  File {index + 1}
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Student</p>
              <p className="font-medium">{assignment.student.full_name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Grade</p>
              <p className="font-medium">{formatGrade(assignment.student.grade)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Subject</p>
              <p className="font-medium">{formatSubject(assignment.subject)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Submitted</p>
              <p className="font-medium">{new Date(assignment.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {assignment.is_team_work && (
              <Badge variant="secondary">Team Work</Badge>
            )}
            {!assignment.is_original_work && (
              <Badge variant="secondary">Adapted Work</Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Student's Response */}
      <Accordion type="single" collapsible defaultValue="response" className="space-y-4">
        <AccordionItem value="response" className="border rounded-lg">
          <Card>
            <AccordionTrigger className="px-6 py-4">
              <h3 className="text-lg font-medium">Student's Response</h3>
            </AccordionTrigger>
            <AccordionContent>
              <div className="px-6 pb-6 space-y-6">
                {assignment.is_team_work && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-600">Team Contribution</h4>
                    <p className="text-sm">{assignment.team_contribution}</p>
                  </div>
                )}

                {!assignment.is_original_work && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-600">Originality Explanation</h4>
                    <p className="text-sm">{assignment.originality_explanation}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-600">Skills Demonstrated</h4>
                  <div className="flex flex-wrap gap-2">
                    {assignment.selected_skills?.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {SKILLS.find(s => s.id === skill)?.name || skill}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm mt-2">{assignment.skills_justification}</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-600">Pride Reason</h4>
                  <p className="text-sm">{assignment.pride_reason}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-600">Creation Process</h4>
                  <p className="text-sm">{assignment.creation_process}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-600">Learnings</h4>
                  <p className="text-sm">{assignment.learnings}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-600">Challenges</h4>
                  <p className="text-sm">{assignment.challenges}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-600">Future Improvements</h4>
                  <p className="text-sm">{assignment.improvements}</p>
                </div>

                {assignment.acknowledgments && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-600">Acknowledgments</h4>
                    <p className="text-sm">{assignment.acknowledgments}</p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </Card>
        </AccordionItem>
      </Accordion>

      {/* Verification Form */}
      <Accordion type="single" collapsible defaultValue="verification" className="space-y-4">
        <AccordionItem value="verification" className="border rounded-lg">
          <Card>
            <AccordionTrigger className="px-6 py-4">
              <h3 className="text-lg font-medium">Teacher Verification</h3>
            </AccordionTrigger>
            <AccordionContent>
              <div className="px-6 pb-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Skills Demonstrated
                  </label>
                  <MultiSelect
                    options={SKILLS.map(skill => ({
                      value: skill.id,
                      label: skill.name
                    }))}
                    value={selectedSkills}
                    onChange={setSelectedSkills}
                    placeholder="Select skills..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Skill Justification
                  </label>
                  <Textarea
                    value={skillJustification}
                    onChange={(e) => setSkillJustification(e.target.value)}
                    placeholder="Explain how the student demonstrated these skills..."
                    className="h-24"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Remarks
                  </label>
                  <Textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Add your feedback..."
                    className="h-24"
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/app/assignments')}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => verifyMutation.mutate('needs_revision')}
                    disabled={verifyMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Needs Revision
                  </Button>
                  <Button
                    onClick={() => verifyMutation.mutate('verified')}
                    disabled={verifyMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </Card>
        </AccordionItem>
      </Accordion>
    </div>
  );
}; 