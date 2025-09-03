import { Assignment } from '@/types/assignments';
import { PreviewSection, PreviewField } from '@/components/ui/preview-section';
import { FileText } from 'lucide-react';
import { SKILLS } from '@/constants';
import { INITIAL_QUESTIONS } from '@/components/assignment-form/QuestionTypes';
import { HtmlContent } from "@/components/ui/html-content";

interface AssignmentDetailsProps {
  assignment: Assignment;
  mode?: 'student' | 'teacher';
}

export function AssignmentDetails({ assignment, mode = 'student' }: AssignmentDetailsProps) {
  // Deduplicate files based on file_name, keeping the latest version
  const uniqueFiles = assignment.files?.reduce((acc, current) => {
    // Find existing file with same name
    const existingIndex = acc.findIndex(file => file.file_name === current.file_name);
    
    if (existingIndex === -1) {
      return [...acc, current];
    }

    // Compare timestamps and keep the latest version
    const existing = acc[existingIndex];
    if (new Date(current.created_at) > new Date(existing.created_at)) {
      acc[existingIndex] = current;
    }
    
    return acc;
  }, [] as typeof assignment.files) || [];

  const renderQuestionWithFollowUps = (questionId: string, answer: any) => {
    const question = INITIAL_QUESTIONS.find(q => q.id === questionId);
    if (!question) return null;

    // Function to detect if a string contains HTML
    const containsHtml = (str: string) => {
      return typeof str === 'string' && /<\/?[a-z][\s\S]*>/i.test(str);
    };

    return (
      <div className="space-y-2">
        <h4 className="text-base font-semibold text-gray-800">{question.label}</h4>
        
        {/* Show follow-up questions if they exist */}
        {question.followUpQuestions && (
          <div className="space-y-1 pl-4">
            {question.followUpQuestions.map((followUp, index) => (
              <p key={index} className="text-sm text-gray-600">
                • {followUp}
              </p>
            ))}
          </div>
        )}

        {/* Show answer based on question type */}
        <div className="mt-2 pl-4">
          <div className="text-sm font-medium text-gray-500">Student's Response:</div>
          {question.type === 'boolean' ? (
            <p className="text-sm text-gray-800">{answer ? 'Yes' : 'No'}</p>
          ) : containsHtml(answer) ? (
            <HtmlContent html={answer} className="text-sm text-gray-800" />
          ) : (
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{answer}</p>
          )}
        </div>
      </div>
    );
  };

  // Group questions by step
  const steps = [
    { title: "Basic Information", questions: INITIAL_QUESTIONS.filter(q => q.step === 1) },
    { title: "Collaboration and Originality", questions: INITIAL_QUESTIONS.filter(q => q.step === 2) },
    { title: "Skills and Pride", questions: INITIAL_QUESTIONS.filter(q => q.step === 3) },
    { title: "Process and Reflection", questions: INITIAL_QUESTIONS.filter(q => q.step === 4) }
  ];

  return (
    <div className="space-y-8">
      {steps.map((step, index) => (
        <PreviewSection key={index} title={step.title}>
          <div className="space-y-6">
            {step.questions.map(question => {
              // Skip file upload question as it's handled separately
              if (question.id === 'artifact') return null;
              
              // Get the answer for this question
              const answer = assignment[question.id as keyof Assignment];
              
              // Only show questions that have answers or are required
              if (answer === undefined && !question.required) return null;
              
              // Only show conditional questions if their condition is met
              if (question.condition && !question.condition(assignment)) return null;

              return (
                <div key={question.id} className="p-4 bg-gray-50 rounded-lg">
                  {renderQuestionWithFollowUps(question.id!, answer)}
                </div>
              );
            })}
          </div>
        </PreviewSection>
      ))}

      <PreviewSection title="Uploaded Files">
        {uniqueFiles.map((file, index) => (
          <div key={file.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/40">
            <FileText className="w-4 h-4 text-gray-500" />
            <a 
              href={file.file_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 truncate"
            >
              {file.file_name}
            </a>
          </div>
        ))}
      </PreviewSection>
    </div>
  );
} 