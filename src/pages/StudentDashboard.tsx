import { useState, useMemo, useCallback, useEffect } from "react";
import { DashboardHeader } from "@/components/student/dashboard/DashboardHeader";
import { AssignmentCard } from "@/components/student/dashboard/AssignmentCard";
import { StickyCorner } from "@/components/student/dashboard/StickyCorner";
import GridPatternBase from "@/components/ui/grid-pattern";
import { Loading } from "@/components/ui/loading";
import { Error } from "@/components/ui/error";
import { StudentDashboardFilters } from "@/types/student-dashboard";
import { useStudentAssignments } from "@/hooks/useStudentAssignments";
import { EnhancedUser } from "@/hooks/useAuthState";
import {
  getSubjectsForGrade,
  GradeLevel,
  ALL_SUBJECTS,
} from "@/constants/grade-subjects";
import {
  initializeStudentFilters,
  filterStudentAssignments,
} from "@/utils/student-dashboard-utils";

/**
 * Main dashboard component for students to view and manage their assignments
 */
export default function StudentDashboard({ user }: { user: EnhancedUser }) {
  // ===== State Management =====
  const [searchQuery, setSearchQuery] = useState("");

  // Default to grade 9 if no grade is provided
  const userGrade = useMemo(() => user?.grades as GradeLevel, [user?.grades]);

  // ===== Subject and Filter Management =====
  // Get available subjects for the current grade
  const availableSubjects = useMemo(() => {
    const subjects = getSubjectsForGrade(userGrade);

    // If no subjects are available, provide default subjects
    if (!subjects?.length) {
      return Object.values(ALL_SUBJECTS).slice(0, 5);
    }

    return subjects;
  }, [userGrade]);

  // Initialize filters dynamically
  const [selectedFilters, setSelectedFilters] =
    useState<StudentDashboardFilters>(
      initializeStudentFilters(availableSubjects)
    );

  // Reset filters when subjects change
  useEffect(() => {
    setSelectedFilters(initializeStudentFilters(availableSubjects));
  }, [availableSubjects]);

  // ===== Assignment Data Handling =====
  // Use the custom hook to fetch and manage assignments
  const {
    assignments,
    isLoading,
    error,
    deleteAssignment,
    editAssignment,
    refetch,
  } = useStudentAssignments(user);

  // Filter assignments based on search query and filter settings
  const filteredAssignments = useMemo(
    () =>
      filterStudentAssignments(
        assignments,
        searchQuery,
        selectedFilters,
        availableSubjects
      ),
    [assignments, searchQuery, selectedFilters, availableSubjects]
  );

  // ===== Event Handlers =====
  const handleDeleteAssignment = useCallback(
    (assignmentId: number) => {
      deleteAssignment(assignmentId);
    },
    [deleteAssignment]
  );

  const handleEditAssignment = useCallback(
    (assignmentId: number) => {
      editAssignment(assignmentId);
    },
    [editAssignment]
  );

  // ===== Render Loading/Error States =====
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-dvh">
        <Loading
          text="Loading assignments..."
          aria-label="Loading assignments"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-dvh">
        <Error
          message={error}
          title="Failed to load assignments"
          retry={refetch}
          retryButtonText="Retry"
          showHomeButton={false}
        />
      </div>
    );
  }

  // ===== Main Dashboard Render =====
  return (
    <div className="relative bg-gray-50 min-h-dvh">
      {/* Background Pattern */}
      <GridPatternBase
        width={20}
        height={20}
        className="absolute inset-0"
        squares={[
          [1, 3],
          [2, 1],
          [5, 2],
          [6, 4],
          [8, 1],
        ]}
      />

      <div className="relative container mx-auto py-8 px-4 space-y-8 flex flex-col min-h-[calc(100vh-8rem)]">
        {/* Dashboard Header with Search and Filters */}
        <DashboardHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedFilters={selectedFilters}
          onFilterChange={setSelectedFilters}
          availableSubjects={availableSubjects}
          currentGrade={userGrade}
        />

        {/* Assignments Content */}
        {filteredAssignments?.length === 0 ? (
          <div
            className="col-span-full flex items-center justify-center flex-grow h-[50vh] md:h-[60vh] bg-gray-50 border border-gray-200 rounded-lg"
            role="status"
            aria-live="polite"
          >
            <p className="text-gray-500">No assignments found</p>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            aria-live="polite"
            aria-busy={isLoading}
          >
            {filteredAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                id={String(assignment.id)}
                {...assignment}
                onDelete={() => handleDeleteAssignment(assignment.id)}
                onEdit={() => handleEditAssignment(assignment.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
