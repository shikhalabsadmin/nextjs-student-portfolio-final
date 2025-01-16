import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DbClient } from '@/types/supabase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Assignment } from '@/types/assignments';

interface Props {
  teacherId: string;
}

type AssignmentWithChildren = Assignment & {
  child_assignments: Array<Assignment & {
    student?: {
      id: string;
      full_name: string;
    };
  }>;
};

export function AssignedWorkView({ teacherId }: Props) {
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['teacher-assignments', teacherId],
    queryFn: async () => {
      const { data } = await (supabase as DbClient)
        .from('assignments')
        .select(`
          *,
          child_assignments:assignments!assignments_parent_assignment_id_fkey (
            id,
            title,
            subject,
            grade,
            status,
            type,
            student:profiles!assignments_student_id_fkey (
              id,
              full_name
            )
          )
        `)
        .eq('teacher_id', teacherId)
        .eq('is_parent', true)
        .order('created_at', { ascending: false });

      return data as unknown as AssignmentWithChildren[];
    },
  });

  if (isLoading) {
    return <div>Loading assignments...</div>;
  }

  if (!assignments?.length) {
    return (
      <Card className="p-6 text-center text-gray-500">
        No assignments created yet
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {assignments.map((assignment) => (
        <Card key={assignment.id} className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium">{assignment.title}</h3>
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
              <span>{assignment.subject}</span>
              <span>•</span>
              <span>Grade {assignment.grade}</span>
            </div>
            {assignment.description && (
              <p className="mt-2 text-gray-600">{assignment.description}</p>
            )}
          </div>

          <div className="space-y-3">
            {assignment.child_assignments?.map((child) => {
              const isVerified = child.status === 'VERIFIED';

              return (
                <Link
                  key={child.id}
                  to={`/app/assignments/${child.id}`}
                  className="block"
                >
                  <Card className="p-4 hover:border-primary transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{child.title}</p>
                        <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                          <span>Grade {child.grade}</span>
                          <span>•</span>
                          <span>
                            {child.student?.full_name}
                          </span>
                          <span>•</span>
                          <span>
                            {isVerified ? 'Verified' : 'Pending Verification'}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {child.type === 'TEACHER_CREATED'
                          ? 'Teacher Created'
                          : 'Student Initiated'}
                      </Badge>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
} 