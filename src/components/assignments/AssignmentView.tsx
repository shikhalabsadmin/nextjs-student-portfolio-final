import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FilePreview } from "@/components/ui/file-preview";
import { Link } from 'react-router-dom';
import { Info, FileText, Link as LinkIcon } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  subject: string;
  description?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'NEEDS_REVISION' | 'VERIFIED';
  artifact_url?: string;
  feedback?: any;
  submitted_at?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
  student?: {
    full_name: string;
  };
}

interface RelatedAssignment {
  id: string;
  title: string;
  subject: string;
  student?: {
    full_name: string;
  };
}

export function AssignmentView({ assignment, showRelated = true }: { assignment: Assignment, showRelated?: boolean }) {
  const [relatedAssignments, setRelatedAssignments] = useState<RelatedAssignment[]>([]);

  // Load related assignments
  useEffect(() => {
    if (!showRelated || !assignment.id) return;

    const loadRelated = async () => {
      const { data } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          subject,
          profiles!assignments_student_id_fkey (
            full_name
          )
        `)
        .neq('id', assignment.id)
        .eq('subject', assignment.subject)
        .limit(5);

      if (data) {
        setRelatedAssignments(data.map(item => ({
          id: item.id,
          title: item.title,
          subject: item.subject,
          student: Array.isArray(item.profiles) && item.profiles[0] ? {
            full_name: item.profiles[0].full_name
          } : undefined
        })));
      }
    };

    loadRelated();
  }, [assignment.id, assignment.subject, showRelated]);

  const getStatusBadgeStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
        return 'bg-blue-50 text-blue-700';
      case 'needs_revision':
        return 'bg-yellow-50 text-yellow-700';
      case 'verified':
        return 'bg-green-50 text-green-700';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold">{assignment.title}</h2>
          <div className="flex gap-2 mt-1 text-sm text-gray-600">
            <span>{assignment.subject}</span>
            <span>•</span>
            <span>By {assignment.student?.full_name || 'Unknown Student'}</span>
            {assignment.submitted_at && (
              <>
                <span>•</span>
                <span>Submitted {new Date(assignment.submitted_at).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </div>
        <Badge 
          variant="secondary"
          className={getStatusBadgeStyle(assignment.status)}
        >
          {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1).toLowerCase()}
        </Badge>
      </div>

      {assignment.description && (
        <div className="prose max-w-none">
          <p>{assignment.description}</p>
        </div>
      )}

      {assignment.artifact_url && (
        <div>
          <h3 className="text-lg font-medium mb-2">Attached Work</h3>
          <a
            href={assignment.artifact_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <FileText className="w-4 h-4" />
            View Attached Work
            <LinkIcon className="w-4 h-4" />
          </a>
        </div>
      )}

      {assignment.feedback && (
        <div>
          <h3 className="text-lg font-medium mb-2">Teacher Feedback</h3>
          <Card className="p-4">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 mt-1 text-blue-600" />
              <div>
                <p className="text-sm">{assignment.feedback.comment}</p>
                {assignment.feedback.suggestions && (
                  <ul className="mt-2 text-sm list-disc pl-4">
                    {assignment.feedback.suggestions.map((suggestion: string, index: number) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {showRelated && relatedAssignments.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3">Related Work</h3>
          <div className="space-y-2">
            {relatedAssignments.map((related) => (
              <Link 
                key={related.id} 
                to={`/app/assignments/${related.id}`}
                className="block"
              >
                <Card className="p-4 hover:border-primary transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{related.title}</p>
                      <p className="text-sm text-gray-500">
                        By {related.student?.full_name || 'Unknown Student'}
                      </p>
                    </div>
                    <Badge variant="outline">{related.subject}</Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 