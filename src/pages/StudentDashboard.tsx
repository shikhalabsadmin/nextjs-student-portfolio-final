import { useState } from "react";
import { DashboardHeader } from "@/components/student/dashboard/DashboardHeader";
import { AssignmentCard } from "@/components/student/dashboard/AssignmentCard";
import StudentCard from "@/components/student/dashboard/StudentDetailCard";
import GridPatternBase from "@/components/ui/grid-pattern";
import { generateAssignments } from "@/data/assignments";
import { studentData } from "@/data/student";
import { StudentDashboardFilters, StudentAssignment } from "@/types/student-dashboard";
import { getSubjectsForGrade, GRADE_LEVELS } from "@/constants/grade-subjects";
import { 
  initializeStudentFilters,
  filterStudentAssignments,
  getGradeAssignments
} from "@/utils/student-dashboard-utils";
import { toast } from "sonner";

// Current student's grade - this would typically come from the student's profile
const CURRENT_GRADE = GRADE_LEVELS.GRADE_7;

// Generate assignments and filter for current grade
const allAssignments = generateAssignments() as StudentAssignment[];
const dummyAssignments = getGradeAssignments(allAssignments, CURRENT_GRADE);

export default function StudentDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [assignments, setAssignments] = useState<StudentAssignment[]>(dummyAssignments);
  
  // Get available subjects for the current grade
  const availableSubjects = getSubjectsForGrade(CURRENT_GRADE);
  
  // Initialize filters dynamically
  const [selectedFilters, setSelectedFilters] = useState<StudentDashboardFilters>(
    initializeStudentFilters(availableSubjects)
  );

  // Filter assignments using student-specific utility
  const filteredAssignments = filterStudentAssignments(
    assignments,
    searchQuery,
    selectedFilters,
    availableSubjects
  );

  const handleDelete = (assignmentId: number) => {
    setAssignments(prevAssignments => {
      const updatedAssignments = prevAssignments.filter(assignment => assignment.id !== assignmentId);
      toast.success("Assignment deleted successfully");
      return updatedAssignments;
    });
  };

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Grid Pattern Background */}
      <GridPatternBase 
        width={40} 
        height={40} 
        className="absolute inset-0" 
        squares={[[1, 3], [2, 1], [5, 2], [6, 4], [8, 1]]} 
      />

      <div className="relative container mx-auto py-8 px-4 space-y-8">
        {/* Student Details Card */}
        <StudentCard {...studentData} />

        {/* Dashboard Header */}
        <DashboardHeader 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedFilters={selectedFilters}
          onFilterChange={setSelectedFilters}
          availableSubjects={availableSubjects}
          currentGrade={CURRENT_GRADE}
        />

        {/* Assignments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              {...assignment}
              onDelete={() => handleDelete(assignment.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}