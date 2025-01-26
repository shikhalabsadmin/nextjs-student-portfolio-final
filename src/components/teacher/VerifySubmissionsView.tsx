import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { formatSubject } from '@/lib/utils';
import { AssignmentFilters } from '../assignments/AssignmentFilters';
import { useAuthState } from '@/hooks/useAuthState';
import { subjectDisplayMap } from '@/constants/subjects';

interface StudentProfile {
  id: string;
  full_name: string;
  grade: string;
}

interface Assignment {
  id: string;
  title: string;
  subject: string;
  grade: string;
  status: 'SUBMITTED' | 'VERIFIED' | 'NEEDS_REVISION';
  submitted_at: string;
  student: StudentProfile;
  month: string;
}

interface TeachingSubject {
  subject: string;
  grade: string;
}

// Helper function to normalize subject names
const normalizeSubject = (subject: string) => {
  if (subject in subjectDisplayMap) {
    return subject.toLowerCase();
  }
  const shortForm = Object.entries(subjectDisplayMap).find(
    ([_, displayName]) => displayName.toLowerCase() === subject.toLowerCase()
  )?.[0];
  return shortForm?.toLowerCase() || subject.toLowerCase();
};

export function VerifySubmissionsView() {
  const navigate = useNavigate();
  const { profile } = useAuthState();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('all');

  // Get teacher's teaching assignments
  const teachingSubjects = profile?.teaching_subjects as TeachingSubject[] || [];
  const teacherGrades = [...new Set(teachingSubjects.map(ts => ts.grade))];
  const teacherSubjectsForGrade = (grade: string) => 
    teachingSubjects
      .filter(ts => ts.grade === grade)
      .map(ts => ts.subject);

  // Fetch unique students for the filter (only from teacher's grades)
  const { data: students } = useQuery({
    queryKey: ['students', teacherGrades],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, grade')
        .eq('role', 'STUDENT')
        .in('grade', teacherGrades)
        .order('full_name');

      if (error) throw error;
      return (data || []) as StudentProfile[];
    },
    enabled: teacherGrades.length > 0
  });

  const { data: assignments, isLoading, error } = useQuery({
    queryKey: ['assignments-to-verify', selectedSubject, selectedGrade, selectedMonth, selectedStatus, selectedStudent, teachingSubjects],
    queryFn: async () => {
      // Get all non-draft assignments
      const { data: allAssignments, error: allError } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          subject,
          grade,
          status,
          submitted_at,
          student:student_id (
            id,
            full_name,
            grade
          ),
          month
        `)
        .neq('status', 'DRAFT');

      if (allError) throw allError;

      // Filter assignments by teacher's grades
      const matchingGradeAssignments = allAssignments?.filter(assignment => 
        teacherGrades.includes(assignment.grade)
      ) || [];

      // Filter assignments by teacher's subjects for each grade
      const matchingGradeAndSubject = matchingGradeAssignments.filter(assignment => {
        const subjectsForGrade = teacherSubjectsForGrade(assignment.grade);
        const normalizedAssignmentSubject = normalizeSubject(assignment.subject);
        const normalizedTeacherSubjects = subjectsForGrade.map(s => normalizeSubject(s));
        return normalizedTeacherSubjects.includes(normalizedAssignmentSubject);
      });

      // Apply filters
      let filteredAssignments = matchingGradeAndSubject.map(assignment => ({
        ...assignment,
        student: assignment.student as unknown as StudentProfile
      })) as Assignment[];

      if (selectedStatus !== 'all') {
        filteredAssignments = filteredAssignments.filter(a => a.status === selectedStatus);
      }

      if (selectedGrade !== 'all') {
        filteredAssignments = filteredAssignments.filter(a => a.grade === selectedGrade);
      }

      if (selectedSubject !== 'all') {
        filteredAssignments = filteredAssignments.filter(a => a.subject === selectedSubject);
      }

      if (selectedStudent !== 'all') {
        filteredAssignments = filteredAssignments.filter(a => a.student.id === selectedStudent);
      }

      return filteredAssignments;
    },
    enabled: teachingSubjects.length > 0
  });

  if (isLoading) return <div>Loading assignments...</div>;
  if (error) return <div>Error loading assignments: {error.message}</div>;

  // Check if teacher has any teaching subjects configured
  if (!teachingSubjects?.length) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-4">No Teaching Subjects Configured</h2>
        <p className="text-gray-600 mb-4">
          Please set up your teaching profile by selecting the grades and subjects you teach.
        </p>
        <Button onClick={() => navigate('/app/teacher/profile')} variant="default">
          Set Up Teaching Profile
        </Button>
      </div>
    );
  }

  if (!assignments?.length) return <div>No assignments found</div>;

  // Filter assignments based on selected filters
  const filteredAssignments = assignments.filter(assignment => {
    if (selectedSubject !== 'all' && assignment.subject !== selectedSubject) return false;
    if (selectedGrade !== 'all' && assignment.grade !== selectedGrade) return false;
    if (selectedMonth !== 'all' && assignment.month !== selectedMonth) return false;
    if (selectedStudent !== 'all' && assignment.student.id !== selectedStudent) return false;
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      return assignment.title.toLowerCase().includes(search);
    }
    return true;
  });

  // Filter available subjects based on selected grade
  const availableSubjects = selectedGrade === 'all' 
    ? [...new Set(teachingSubjects.map(ts => ts.subject))]
    : teacherSubjectsForGrade(selectedGrade);

  return (
    <div className="space-y-4">
      <AssignmentFilters 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedSubject={selectedSubject}
        onSubjectChange={setSelectedSubject}
        selectedGrade={selectedGrade}
        onGradeChange={setSelectedGrade}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        students={students || []}
        selectedStudent={selectedStudent}
        onStudentChange={setSelectedStudent}
        availableGrades={teacherGrades}
        availableSubjects={availableSubjects}
      />

      <div className="rounded-md border">
        {/* Header */}
        <div className="grid grid-cols-[1fr,200px,120px,120px,120px] gap-4 px-4 py-3 border-b bg-muted/50">
          <div className="text-sm font-medium">Title</div>
          <div className="text-sm font-medium">Student</div>
          <div className="text-sm font-medium">Subject</div>
          <div className="text-sm font-medium">Grade</div>
          <div className="text-sm font-medium">Status</div>
        </div>

        {/* Rows */}
        <div className="divide-y">
          {filteredAssignments.map((assignment) => (
            <div
              key={assignment.id}
              className="grid grid-cols-[1fr,200px,120px,120px,120px] gap-4 px-4 py-3 hover:bg-muted/50 cursor-pointer items-center"
              onClick={() => navigate(`/app/verify/${assignment.id}`)}
            >
              <div className="font-medium truncate">
                {assignment.title}
              </div>
              <div className="text-sm truncate">
                {assignment.student.full_name}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatSubject(assignment.subject)}
              </div>
              <div className="text-sm text-muted-foreground">
                Grade {assignment.grade}
              </div>
              <div>
                <Badge 
                  variant={assignment.status === 'VERIFIED' ? 'secondary' : 'default'}
                  className="capitalize"
                >
                  {assignment.status.toLowerCase().replace('_', ' ')}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 