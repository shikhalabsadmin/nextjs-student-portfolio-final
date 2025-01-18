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
import { INITIAL_QUESTIONS } from '@/components/assignment-form/QuestionTypes';

export const VerifyAssignment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  console.log('[DEBUG] Assignment ID:', id);

  const [remarks, setRemarks] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillJustification, setSkillJustification] = useState('');
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);

  const { data: assignment, isLoading, error } = useQuery<Assignment>({
    queryKey: ['assignment', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          student:profiles!assignments_student_id_fkey(
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

      console.log('[DEBUG] Query response:', { data, error });

      if (error) {
        console.error('[DEBUG] Supabase error:', error);
        console.error('[DEBUG] Error details:', error.details);
        console.error('[DEBUG] Error hint:', error.hint);
        throw error;
      }
      
      console.log('[DEBUG] Raw assignment data:', data);
      console.log('[DEBUG] Student data:', data?.student);
      console.log('[DEBUG] Teacher View - Files:', {
        id: data.id,
        artifact_url: data.artifact_url,
        files: data.files,
        filesCount: data.files?.length,
        artifact_urls: data.artifact_url?.split(',') || []
      });
      
      if (!data?.student) {
        throw new Error('Student data not found');
      }
      
      // Transform the response to match the Assignment type
      const transformedData = {
        ...data,
        student: data.student, // Student is already an object
        files: data.files || [] // Keep files array as is, default to empty array
      };
      
      console.log('[DEBUG] Transformed data:', transformedData);
      
      return transformedData as Assignment;
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

  const renderQuestionWithFollowUps = (questionId: string, answer: any) => {
    const question = INITIAL_QUESTIONS.find(q => q.id === questionId);
    if (!question) return null;

    return (
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <h4 className="text-base font-semibold text-gray-800">{question.label}</h4>
          
          {/* Show follow-up questions if they exist */}
          {question.followUpQuestions && (
            <div className="mt-2 space-y-1">
              {question.followUpQuestions.map((followUp, index) => (
                <p key={index} className="text-sm text-gray-600">
                  • {followUp}
                </p>
              ))}
            </div>
          )}

          {/* Show answer based on question type */}
          <div className="mt-4 border-t pt-3">
            <div className="text-sm font-medium text-gray-500 mb-1">Student's Response:</div>
            {question.type === 'boolean' ? (
              <p className="text-sm text-gray-800">{answer ? 'Yes' : 'No'}</p>
            ) : (
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{answer}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    console.error('[DEBUG] Query error:', error);
    return <div>Error loading assignment: {error.message}</div>;
  }

  if (!assignment || !assignment.student) {
    return <div>Assignment or student data not found</div>;
  }

  // Deduplicate files based on file_url
  const uniqueFiles = assignment.files?.reduce((acc, current) => {
    const x = acc.find(item => item.file_url === current.file_url);
    if (!x) {
      return acc.concat([current]);
    } else {
      return acc;
    }
  }, [] as typeof assignment.files) || [];

  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-6">
      {/* Assignment Header */}
      <Card className="p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold">{assignment.title}</h1>
            <div className="flex gap-2">
              {uniqueFiles.map((file, index) => (
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
                {/* Basic Information - Step 1 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
                  {renderQuestionWithFollowUps('artifact_type', assignment.artifact_type)}
                  {renderQuestionWithFollowUps('month', assignment.month)}
                  {renderQuestionWithFollowUps('subject', assignment.subject)}
                </div>

                {/* Collaboration and Originality - Step 2 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Collaboration and Originality</h3>
                  {renderQuestionWithFollowUps('is_team_work', assignment.is_team_work)}
                  {assignment.is_team_work && renderQuestionWithFollowUps('team_contribution', assignment.team_contribution)}
                  {renderQuestionWithFollowUps('is_original_work', assignment.is_original_work)}
                  {assignment.is_original_work && renderQuestionWithFollowUps('originality_explanation', assignment.originality_explanation)}
                </div>

                {/* Skills and Pride - Step 3 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Skills and Pride</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-base font-semibold text-gray-800">Skills Demonstrated</h4>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {assignment.selected_skills?.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {SKILLS.find(s => s.id === skill)?.name || skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {renderQuestionWithFollowUps('skills_justification', assignment.skills_justification)}
                  {renderQuestionWithFollowUps('pride_reason', assignment.pride_reason)}
                </div>

                {/* Process, Learning, and Reflection - Step 4 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Process, Learning, and Reflection</h3>
                  {renderQuestionWithFollowUps('creation_process', assignment.creation_process)}
                  {renderQuestionWithFollowUps('learnings', assignment.learnings)}
                  {renderQuestionWithFollowUps('challenges', assignment.challenges)}
                  {renderQuestionWithFollowUps('improvements', assignment.improvements)}
                  {renderQuestionWithFollowUps('acknowledgments', assignment.acknowledgments)}
                </div>
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