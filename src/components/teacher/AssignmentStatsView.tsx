import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AssignmentWithRelations } from '@/types/assignments';
import { TeachingSubject, Database, DbClient } from '@/types/supabase';
import { AssignmentFilters } from './AssignmentFilters';
import { AssignmentStatsCard } from './AssignmentStatsCard';
import { EditAssignmentModal } from './EditAssignmentModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface AssignmentStatsViewProps {
  teacherSubjects: TeachingSubject[];
  teacherGrades: string[];
  onAssignmentClick: (assignment: AssignmentWithRelations) => void;
}

type DbAssignment = Database['public']['Tables']['assignments']['Row'];
type DbSubmission = Database['public']['Tables']['submissions']['Row'];

interface ProcessedAssignment extends DbAssignment {
  submissionCount: number;
  verificationCount: number;
  teacherCreatedCount: number;
  studentInitiatedCount: number;
  submissions?: DbSubmission[];
  is_team_work: boolean;
  is_original_work: boolean;
}

export function AssignmentStatsView({ 
  teacherSubjects, 
  teacherGrades,
  onAssignmentClick 
}: AssignmentStatsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedWeek, setSelectedWeek] = useState<string>('all');
  const [isTeacherAssigned, setIsTeacherAssigned] = useState<boolean | undefined>(undefined);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [assignmentToEdit, setAssignmentToEdit] = useState<ProcessedAssignment | null>(null);
  const queryClient = useQueryClient();

  const { data: assignments } = useQuery({
    queryKey: ['assignments-stats', selectedSubject, selectedGrade, selectedWeek, isTeacherAssigned],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const query = (supabase as DbClient)
        .from('assignments')
        .select(`
          *,
          submissions (
            id,
            status,
            student_id
          )
        `)
        .eq('teacher_id', user.id)
        .eq(selectedSubject !== 'all' ? 'subject' : '', selectedSubject)
        .eq(selectedGrade !== 'all' ? 'grade' : '', selectedGrade);

      const { data: assignmentsData, error } = await query;

      if (error) throw error;
      if (!assignmentsData) return [];

      // Process assignments
      return (assignmentsData as ProcessedAssignment[]).map((assignment) => {
        const submissionCount = assignment.submissions?.length ?? 0;
        const verifiedCount = assignment.submissions?.filter(s => s.status === 'VERIFIED').length ?? 0;

        return {
          ...assignment,
          submissionCount,
          verificationCount: verifiedCount,
          teacherCreatedCount: assignment.type === 'TEACHER_CREATED' ? 1 : 0,
          studentInitiatedCount: assignment.type === 'STUDENT_INITIATED' ? 1 : 0,
          is_team_work: assignment.is_team_work ?? false,
          is_original_work: assignment.is_original_work ?? false
        };
      });
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0
  });

  const handleEditClick = (assignment: ProcessedAssignment) => {
    setAssignmentToEdit(assignment);
    setShowEditModal(true);
  };

  const handleDeleteClick = (assignmentId: string) => {
    setAssignmentToDelete(assignmentId);
    setShowDeleteAlert(true);
  };

  const handleDelete = async () => {
    if (!assignmentToDelete) return;

    try {
      const { error } = await (supabase as DbClient)
        .from('assignments')
        .delete()
        .eq('id', assignmentToDelete);

      if (error) throw error;

      // Invalidate and refetch all relevant queries
      await Promise.all([
        // Stats view queries
        queryClient.invalidateQueries({ queryKey: ['assignments-stats'] }),
        queryClient.refetchQueries({ queryKey: ['assignments-stats'] }),
        // Student assignments queries
        queryClient.invalidateQueries({ queryKey: ['assignments'] }),
        queryClient.refetchQueries({ queryKey: ['assignments'] }),
        // Dashboard stats queries
        queryClient.invalidateQueries({ queryKey: ['assignment-stats'] }),
        queryClient.refetchQueries({ queryKey: ['assignment-stats'] }),
        // Admin stats if they exist
        queryClient.invalidateQueries({ queryKey: ['adminStats'] }),
        queryClient.refetchQueries({ queryKey: ['adminStats'] })
      ]);
      
      setShowDeleteAlert(false);
      setAssignmentToDelete(null);
    } catch (error) {
      console.error('Error deleting assignment:', error);
    }
  };

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
      
      <div className="space-y-4">
        {assignments?.map((assignment) => (
          <AssignmentStatsCard
            key={assignment.id}
            topic={assignment.title}
            subject={assignment.subject}
            grade_levels={[assignment.grade]}
            submissionCount={assignment.submissionCount}
            verificationCount={assignment.verificationCount}
            teacherCreatedCount={assignment.teacherCreatedCount}
            studentInitiatedCount={assignment.studentInitiatedCount}
            description={assignment.description || null}
            onClick={() => onAssignmentClick(assignment as unknown as AssignmentWithRelations)}
            onEdit={() => handleEditClick(assignment)}
            onDelete={() => handleDeleteClick(assignment.id)}
          />
        ))}
      </div>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this assignment.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showEditModal && assignmentToEdit && (
        <EditAssignmentModal
          assignment={assignmentToEdit}
          onClose={() => {
            setShowEditModal(false);
            setAssignmentToEdit(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['assignments-stats'] });
          }}
        />
      )}
    </div>
  );
} 