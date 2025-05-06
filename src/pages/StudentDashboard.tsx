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
import teacherFeedbackImage from "/teacher-feedback.png";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { useNavigate } from "react-router-dom";

// Helper to extract error message from different error types
const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === "object") {
    if ("message" in error) return error.message as string;
    if ("type" in error && "message" in error) return error.message as string;
  }
  return String(error);
};

/**
 * Main dashboard component for students to view and manage their assignments
 */
export default function StudentDashboard({ user }: { user: EnhancedUser }) {
  // ===== State Management =====
  const [searchQuery, setSearchQuery] = useState("");

  // ===== Navigation =====
  const navigate = useNavigate();

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
    isRefetching,
    isFetching,
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

  const handleAddAssignment = () => {
    navigate(ROUTES.STUDENT.MANAGE_ASSIGNMENT);
  };

  // ===== Render Loading/Error States =====
  if (isLoading || isRefetching || isFetching) {
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
          message={getErrorMessage(error)}
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
            className="flex flex-col items-center justify-center gap-2.5 flex-grow h-[50vh] md:h-[60vh] bg-gray-50 border border-gray-200 rounded-lg"
            role="status"
            aria-live="polite"
          >
            <img
              src={teacherFeedbackImage}
              alt="Teacher feedback illustration"
              className="w-full max-w-[200px] sm:max-w-[280px] md:max-w-[320px] lg:max-w-[408px] h-auto object-contain"
            />
            <p className="text-gray-500 text-base md:text-xl">No work found</p>
            <Button
              variant="default"
              size="sm"
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg mt-2.5 text-xs md:text-sm"
              onClick={handleAddAssignment}
            >
              Create new work
            </Button>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            aria-live="polite"
            aria-busy={isLoading || isRefetching || isFetching}
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
