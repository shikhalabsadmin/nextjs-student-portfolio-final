import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthState } from "@/hooks/useAuthState";
import { VerifySubmissionsView } from '@/components/teacher/VerifySubmissionsView';
import { AssignmentStatsView } from '@/components/teacher/AssignmentStatsView';
import { Button } from "@/components/ui/button";
import { StudentAssignments } from "@/components/student/StudentAssignments";
import { AssignmentDebugger } from '@/components/debug/AssignmentDebugger';

export const Assignments = () => {
  const [activeTab, setActiveTab] = useState('verify');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const { user, profile, userRole } = useAuthState();
  const teacherSubjects = profile?.teaching_subjects ?? [];
  const teacherGrades = profile?.grade_levels ?? [];

  const handleAssignmentClick = (assignment: any) => {
    setActiveTab('verify');
    setSelectedTopic(assignment.topic);
  };

  if (userRole === 'TEACHER') {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Assignments</h1>
          <Link 
            to="/app/teacher/assignments/new"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Create Assignment
          </Link>
        </div>

        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'verify' ? 'default' : 'outline'}
            onClick={() => setActiveTab('verify')}
          >
            Submissions
          </Button>
          <Button
            variant={activeTab === 'assigned' ? 'default' : 'outline'}
            onClick={() => setActiveTab('assigned')}
          >
            Assigned Work
          </Button>
        </div>

        {activeTab === 'verify' ? (
          <VerifySubmissionsView selectedTopic={selectedTopic} />
        ) : (
          <AssignmentStatsView 
            teacherSubjects={teacherSubjects}
            teacherGrades={teacherGrades}
            onAssignmentClick={handleAssignmentClick} 
          />
        )}

        <AssignmentDebugger />
      </div>
    );
  }

  return <StudentAssignments />;
};

export default Assignments;