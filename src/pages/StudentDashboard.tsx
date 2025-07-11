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
import { Card } from "@/components/ui/card";
import { ROUTES } from "@/config/routes";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

// Helper to extract error message from different error types
const getErrorMessage = (error: unknown): string => {
  console.error("StudentDashboard error details:", error);

  if (!error) {
    return "An unknown error occurred";
  }

  // Check if it's an object with a message property
  if (error && typeof error === "object") {
    if ("message" in error) {
      const message = error.message as string;
      
      // Check for common error patterns
      if (message.includes('Failed to fetch') || message.includes('Network error')) {
        return "Network connection issue. Please check your internet connection and try again.";
      }

      if (message.includes('not found') || message.includes('404')) {
        return "Assignment not found. It may have been deleted or moved.";
      }

      if (message.includes('permission') || message.includes('unauthorized') || message.includes('403')) {
        return "You don't have permission to access this assignment. Please log in again.";
      }
      
      return message;
    }
    
    if ("type" in error && "message" in error) {
      const errMsg = error.message as string;
      const errType = error.type as string;
      
      // Log detailed type-based errors for debugging
      console.error(`Error type: ${errType}, message: ${errMsg}`);
      
      // Provide user-friendly messages based on error type
      if (errType === 'fetch') {
        return "Failed to load assignments. Please try again later.";
      }
      
      if (errType === 'auth') {
        return "Authentication error. Please log in again.";
      }
      
      if (errType === 'network') {
        return "Network connection issue. Please check your internet connection.";
      }
      
      return errMsg;
    }
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
    (assignmentId: string) => { // Changed from number to string
      deleteAssignment(assignmentId);
    },
    [deleteAssignment]
  );

  const handleEditAssignment = useCallback(
    (assignmentId: string) => { // Changed from number to string
      editAssignment(assignmentId);
    },
    [editAssignment]
  );

  const handleAddAssignment = () => {
    // Add console logging
    console.log("Adding new assignment from StudentDashboard");
    
    // Clear any form data
    localStorage.removeItem('assignmentFormData');
    localStorage.removeItem('assignmentFormStep');
    localStorage.removeItem('formData');
    localStorage.removeItem('step');
    
    // Navigate using 'new' instead of ':id' placeholder
    const targetRoute = ROUTES.STUDENT.MANAGE_ASSIGNMENT.replace(':id', 'new');
    console.log("Navigating to:", targetRoute);
    navigate(targetRoute);
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
    <div className="relative bg-gray-50 min-h-screen pb-4">
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

      <div className="relative container mx-auto pt-2 sm:pt-4 px-3 sm:px-4">
        {/* Dashboard Header with Search and Filters */}
        <div className="z-10 bg-gray-50 bg-opacity-90 backdrop-blur-sm pb-3 sm:pb-4">
          <DashboardHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedFilters={selectedFilters}
            onFilterChange={setSelectedFilters}
            availableSubjects={availableSubjects}
            currentGrade={userGrade}
          />
        </div>

        {/* Assignments Content */}
        <div className="mt-3 sm:mt-4">
          {filteredAssignments?.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-2 sm:gap-2.5 py-8 sm:py-12 bg-gray-50 border border-gray-200 rounded-lg"
              role="status"
              aria-live="polite"
            >
              <img
                src={teacherFeedbackImage}
                alt="Teacher feedback illustration"
                className="w-full max-w-[180px] sm:max-w-[220px] md:max-w-[300px] h-auto object-contain"
              />
              <p className="text-gray-500 text-sm sm:text-base md:text-xl">No work found</p>
              <Button
                variant="default"
                size="sm"
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg mt-2 sm:mt-2.5 text-xs md:text-sm"
                onClick={handleAddAssignment}
              >
                Create new work
              </Button>
            </div>
          ) : (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 xl:gap-8"
              aria-live="polite"
              aria-busy={isLoading || isRefetching || isFetching}
            >
              {/* Add New Work Card - Always visible */}
              <Card 
                className="overflow-hidden rounded-xl border border-dashed border-[#4F46E5] bg-[#F9F7FF] hover:bg-[#F5F3FF] hover:shadow-[0px_4px_8px_-2px_rgba(79,70,229,0.1),0px_2px_4px_-2px_rgba(79,70,229,0.06)] transition-all duration-200 cursor-pointer flex flex-col items-center justify-center h-full min-h-[200px] sm:min-h-[240px]"
                onClick={handleAddAssignment}
              >
                <div className="flex flex-col items-center justify-center p-4 sm:p-6 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#EBE9FE] flex items-center justify-center mb-3 sm:mb-4">
                    <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-[#4F46E5]" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-[#4F46E5] mb-1 sm:mb-2">Add New Work</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Create a new assignment to showcase your skills</p>
                </div>
              </Card>

              {/* Existing Assignments */}
              {filteredAssignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  id={assignment.id} // No need to convert to String
                  {...assignment}
                  onDelete={() => handleDeleteAssignment(assignment.id)}
                  onEdit={() => handleEditAssignment(assignment.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
