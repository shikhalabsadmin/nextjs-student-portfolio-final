import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Assignment {
  id?: string;
  title: string;
  subject: string;
  artifact_type: string;
  status?: string;
  artifact_url?: string;
  is_team_work?: boolean;
  is_team_project?: boolean;
  is_original_work?: boolean;
  team_contribution?: string | null;
  originality_explanation?: string | null;
  skills?: string[];
  skills_justification?: string | null;
  pride_reason?: string | null;
  creation_process?: string | null;
  learnings?: string | null;
  challenges?: string | null;
  improvements?: string | null;
  acknowledgments?: string | null;
  grade?: number;
}

export const AssignmentView: React.FC<{ assignment: Assignment; isPreview?: boolean }> = ({ assignment, isPreview = false }) => {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">{assignment.title}</h1>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-medium mb-4">Basic Information</h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-gray-500">Subject</dt>
                <dd>{assignment.subject}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Type</dt>
                <dd>{assignment.artifact_type}</dd>
              </div>
              {assignment.status && (
                <div>
                  <dt className="text-sm text-gray-500">Status</dt>
                  <dd>
                    <Badge>{assignment.status}</Badge>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {assignment.artifact_url && (
            <div>
              <h2 className="text-lg font-medium mb-4">Files</h2>
              <div className="space-y-2">
                {assignment.artifact_url.split(',').map((url, index) => (
                  <a 
                    key={index}
                    href={`${supabase.storage.from('assignments').getPublicUrl(url).data.publicUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    View File {index + 1}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Collaboration Section */}
      {(assignment.is_team_work || assignment.is_original_work) && (
        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">Collaboration & Originality</h2>
          {assignment.team_contribution && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">Team Contribution</h3>
              <p className="text-gray-700">{assignment.team_contribution}</p>
            </div>
          )}
          {assignment.originality_explanation && (
            <div>
              <h3 className="font-medium mb-2">Original Work</h3>
              <p className="text-gray-700">{assignment.originality_explanation}</p>
            </div>
          )}
        </Card>
      )}

      {/* Skills Section */}
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-4">Skills & Process</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Selected Skills</h3>
            <div className="flex gap-2">
              {assignment.skills?.map((skill) => (
                <Badge key={skill} variant="secondary">{skill}</Badge>
              ))}
            </div>
            {assignment.skills_justification && (
              <p className="mt-2 text-gray-700">{assignment.skills_justification}</p>
            )}
          </div>
          {assignment.creation_process && (
            <div>
              <h3 className="font-medium mb-2">Creation Process</h3>
              <p className="text-gray-700">{assignment.creation_process}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Reflection Section */}
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-4">Reflection</h2>
        <div className="space-y-4">
          {assignment.learnings && (
            <div>
              <h3 className="font-medium mb-2">Learnings</h3>
              <p className="text-gray-700">{assignment.learnings}</p>
            </div>
          )}
          {assignment.challenges && (
            <div>
              <h3 className="font-medium mb-2">Challenges</h3>
              <p className="text-gray-700">{assignment.challenges}</p>
            </div>
          )}
          {assignment.improvements && (
            <div>
              <h3 className="font-medium mb-2">Future Improvements</h3>
              <p className="text-gray-700">{assignment.improvements}</p>
            </div>
          )}
          {assignment.acknowledgments && (
            <div>
              <h3 className="font-medium mb-2">Acknowledgments</h3>
              <p className="text-gray-700">{assignment.acknowledgments}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
} 