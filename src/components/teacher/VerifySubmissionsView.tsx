import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Clock, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatSubject } from '@/lib/utils';
import { AssignmentFilters } from './AssignmentFilters';

interface TeachingSubject {
  subject: string;
  grade: string;
}

interface TeacherProfile {
  teaching_subjects: { subject: string; grade: string }[] | null;
  grade_levels: string[] | null;
}

interface StudentProfile {
  id: string;
  full_name: string | null;
  grade: string | null;
}

interface Assignment {
  id: string;
  title: string;
  subject: string;
  status: string;
  student: StudentProfile | null;
  created_at: string;
  teacher_id: string | null;
}

interface VerifySubmissionsViewProps {
  selectedTopic: string | null;
}

interface Submission {
  id: string;
  title: string;
  subject: string;
  status: string;
  created_at: string;
  student: {
    id: string;
    full_name: string | null;
    grade: string | null;
  } | null;
  assignment: {
    id: string;
    teacher_id: string | null;
  } | null;
}

export const VerifySubmissionsView = ({ selectedTopic }: VerifySubmissionsViewProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedWeek, setSelectedWeek] = useState('all');
  const [isTeacherAssigned, setIsTeacherAssigned] = useState<boolean | undefined>();

  // Update search when topic changes
  useEffect(() => {
    if (selectedTopic) {
      setSearchTerm(selectedTopic);
    }
  }, [selectedTopic]);

  const { data: submissions, isLoading, error } = useQuery({
    queryKey: ['submissions-to-verify', selectedSubject, selectedGrade, selectedWeek, isTeacherAssigned, searchTerm],
    queryFn: async () => {
      try {
        // First get the teacher's profile
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Get teacher's profile with teaching subjects and grades
        const { data: rawProfile, error: profileError } = await supabase
          .from('profiles')
          .select('teaching_subjects, grade_levels')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        if (!rawProfile) throw new Error('Teacher profile not found');

        const profile: TeacherProfile = {
          teaching_subjects: (rawProfile as any).teaching_subjects || null,
          grade_levels: (rawProfile as any).grade_levels || null
        };
        console.log('Teacher profile:', profile);

        // Get all submitted submissions that haven't been verified
        const { data: verifications } = await supabase
          .from('verifications')
          .select('assignment_id, status');

        console.log('Verifications:', verifications);

        // Only exclude submissions that have been verified (not rejected)
        const verifiedIds = verifications
          ?.filter(v => v.status !== 'rejected')
          .map(v => v.assignment_id) || [];

        console.log('Verified IDs to exclude:', verifiedIds);

        // Get submitted submissions that haven't been verified
        const { data: submissions, error: submissionsError } = await supabase
          .from('submissions')
          .select(`
            id,
            title,
            subject,
            status,
            created_at,
            student:profiles!student_id (
              id,
              full_name,
              grade
            ),
            assignment:assignments!assignment_id (
              id,
              teacher_id
            )
          `)
          .eq('status', 'SUBMITTED')
          .not(verifiedIds.length > 0 ? 'id' : 'id', 'in', `(${verifiedIds.join(',')})`)
          .order('created_at', { ascending: false }) as { 
            data: Submission[] | null;
            error: any;
          };

        console.log('All submitted submissions:', submissions);

        if (submissionsError) {
          console.error('Error fetching submissions:', submissionsError);
          throw submissionsError;
        }
        if (!submissions) return [];

        // Filter submissions based on teacher's subjects and grades
        const teachingSubjectGradePairs = new Set(
          (profile.teaching_subjects || []).map(ts => `${ts.subject.toLowerCase()}-${ts.grade}`)
        );

        console.log('Teacher subject-grade pairs:', teachingSubjectGradePairs);
        
        let filteredData = submissions.filter(submission => {
          const studentGrade = submission.student?.grade;
          if (!studentGrade) return false;
          
          const pair = `${submission.subject.toLowerCase()}-${studentGrade}`;
          const matches = teachingSubjectGradePairs.has(pair);
          console.log(`Checking ${pair} against teacher pairs:`, matches);
          return matches;
        });

        console.log('After teacher subject/grade filter:', filteredData);

        // Apply additional filters
        if (selectedSubject && selectedSubject !== 'all') {
          filteredData = filteredData.filter(d => d.subject.toLowerCase() === selectedSubject.toLowerCase());
          console.log('After subject filter:', filteredData);
        }
        if (selectedGrade && selectedGrade !== 'all') {
          filteredData = filteredData.filter(d => d.student?.grade === selectedGrade);
          console.log('After grade filter:', filteredData);
        }
        if (selectedWeek && selectedWeek !== 'all') {
          filteredData = filteredData.filter(d => d.created_at && d.created_at.startsWith(selectedWeek));
          console.log('After week filter:', filteredData);
        }
        if (isTeacherAssigned !== undefined) {
          filteredData = filteredData.filter(d => isTeacherAssigned ? !!d.assignment?.teacher_id : !d.assignment?.teacher_id);
          console.log('After teacher assigned filter:', filteredData);
        }
        if (searchTerm) {
          filteredData = filteredData.filter(d => {
            const studentName = d.student?.full_name;
            return d.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   studentName?.toLowerCase().includes(searchTerm.toLowerCase());
          });
          console.log('After search filter:', filteredData);
        }

        return filteredData;
      } catch (error) {
        console.error('Error in submissions query:', error);
        throw error;
      }
    }
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-8">
      <div className="text-gray-500">Loading submissions...</div>
    </div>
  );

  if (error) return (
    <div className="text-center text-red-500 py-8">
      <p>Failed to load submissions. Please try again.</p>
      <p className="text-sm mt-2">{error instanceof Error ? error.message : 'Unknown error'}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <AssignmentFilters
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        selectedSubject={selectedSubject}
        onSubjectChange={setSelectedSubject}
        selectedGrade={selectedGrade}
        onGradeChange={setSelectedGrade}
        selectedWeek={selectedWeek}
        onWeekChange={setSelectedWeek}
        isTeacherAssigned={isTeacherAssigned}
        onTeacherAssignedChange={setIsTeacherAssigned}
      />

      {/* Submissions List */}
      <div className="space-y-4">
        {submissions?.map((submission) => (
          <Card 
            key={submission.id}
            className="p-4 hover:border-blue-200 cursor-pointer"
            onClick={() => navigate(`/app/verify/${submission.id}`)}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">{submission.title}</h3>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>By {submission.student?.full_name}</p>
                  <p>Subject: {formatSubject(submission.subject)}</p>
                  <p>Grade: {submission.student?.grade}</p>
                </div>
              </div>
              <Badge 
                variant="secondary"
                className="bg-yellow-100 text-yellow-800"
              >
                <Clock className="h-3 w-3 mr-1" />
                Pending Verification
              </Badge>
            </div>
          </Card>
        ))}

        {submissions?.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p className="mb-2">No submissions found</p>
            {(searchTerm || selectedSubject !== 'all' || selectedGrade !== 'all' || selectedWeek !== 'all' || isTeacherAssigned !== undefined) ? (
              <p className="text-sm">Try adjusting your filters or search terms</p>
            ) : (
              <p className="text-sm">No assignments are pending verification</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 