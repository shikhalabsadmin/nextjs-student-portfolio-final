import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VerifySubmissionsView } from '@/components/teacher/VerifySubmissionsView';
import { AssignmentStatsView } from '@/components/teacher/AssignmentStatsView';
import { useAuthState } from '@/hooks/useAuthState';
import { AssignmentWithRelations } from '@/types/assignments';

type TabValue = 'verify' | 'stats';

export const TeacherAssignments = () => {
  const navigate = useNavigate();
  const { user, userRole, isLoading, profile } = useAuthState();
  const [activeTab, setActiveTab] = useState<TabValue>('verify');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithRelations | null>(null);

  const teacherSubjects = profile?.teaching_subjects ?? [];
  const teacherGrades = profile?.grade_levels ?? [];

  const handleAssignmentClick = (assignment: AssignmentWithRelations) => {
    setActiveTab('verify');
    setSelectedAssignment(assignment);
  };

  // Show loading state
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Redirect if not a teacher
  if (!isLoading && userRole !== 'TEACHER') {
    navigate('/app/dashboard');
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Assignments</h1>
        <Button onClick={() => navigate('/app/teacher/assignments/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Assignment
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList>
          <TabsTrigger value="verify">Submissions</TabsTrigger>
          <TabsTrigger value="stats">Assignment Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="verify">
          <VerifySubmissionsView selectedTopic={selectedTopic} />
        </TabsContent>

        <TabsContent value="stats">
          <AssignmentStatsView 
            teacherSubjects={teacherSubjects} 
            teacherGrades={teacherGrades}
            onAssignmentClick={handleAssignmentClick} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}; 