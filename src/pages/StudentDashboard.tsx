import { useState, useMemo, useCallback } from "react";
import { DashboardHeader } from "@/components/student/dashboard/DashboardHeader";
import { AssignmentCard } from "@/components/student/dashboard/AssignmentCard";
import { StickyCorner } from "@/components/student/dashboard/StickyCorner";
import StudentCard from "@/components/student/dashboard/StudentDetailCard";
import GridPatternBase from "@/components/ui/grid-pattern";
import { StudentDashboardFilters } from "@/types/student-dashboard";
import { getSubjectsForGrade, GradeLevel } from "@/constants/grade-subjects";
import {
  initializeStudentFilters,
  filterStudentAssignments,
} from "@/utils/student-dashboard-utils";
import { useStudentAssignments } from "@/hooks/useStudentAssignments";
import { Loading } from "@/components/ui/loading";
import { Error } from "@/components/ui/error";
import { EnhancedUser } from "@/hooks/useAuthState";

// Empty state component
const EmptyAssignments = () => (
  <div
    className="col-span-full flex items-center justify-center flex-grow h-[50vh] md:h-[60vh] bg-gray-50 border border-gray-200 rounded-lg"
    role="status"
    aria-live="polite"
  >
    <p className="text-gray-500">No assignments found</p>
  </div>
);

export default function StudentDashboard({ user }: { user: EnhancedUser }) {
  const [searchQuery, setSearchQuery] = useState("");

  // Get available subjects for the current grade
  const availableSubjects = useMemo(
    () => getSubjectsForGrade(user?.grades as GradeLevel) || [],
    [user?.grades]
  );

  // Initialize filters dynamically
  const [selectedFilters, setSelectedFilters] =
    useState<StudentDashboardFilters>(
      initializeStudentFilters(availableSubjects)
    );

  // Use the custom hook to fetch and manage assignments
  const { assignments, isLoading, error, deleteAssignment, editAssignment, refetch } =
    useStudentAssignments(user);

  // Memoize the filtered assignments to prevent unnecessary recalculations
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
  
  // Memoize callback function to prevent unnecessary recreations
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

  {
    /* Loading and Error States */
  }

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
  return (
    <div className="relative bg-gray-50 min-h-dvh">
      {/* Grid Pattern Background */}
      <GridPatternBase
        width={40}
        height={40}
        className="absolute inset-0"
        squares={[
          [1, 3],
          [2, 1],
          [5, 2],
          [6, 4],
          [8, 1],
        ]}
      />

      {/* Sticky Corner - Positioned absolutely */}
      <StickyCorner />

      <div className="relative container mx-auto py-8 px-4 space-y-8 flex flex-col min-h-[calc(100vh-8rem)]">
        {/* Student Details Card */}
        <StudentCard
          name={
            user?.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "Student"
          }
          className_name={(user?.grades as GradeLevel) || `Update your grade`}
          school={user?.user_metadata?.school_name || "Shikha"}
          imageUrl={user?.user_metadata?.avatar_url}
          description={user?.user_metadata?.bio || "Student at Shikha"}
        />
        {filteredAssignments?.length === 0 ? (
          <EmptyAssignments />
        ) : (
          <>
            {/* Dashboard Header */}
            <DashboardHeader
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedFilters={selectedFilters}
              onFilterChange={setSelectedFilters}
              availableSubjects={availableSubjects}
              currentGrade={user?.grades as GradeLevel}
            />

            {/* Assignments Grid */}
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              aria-live="polite"
              aria-busy={isLoading}
            >
              {filteredAssignments?.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  id={assignment.id}
                  {...assignment}
                  onDelete={() => handleDeleteAssignment(assignment.id)}
                  onEdit={() => handleEditAssignment(assignment.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
