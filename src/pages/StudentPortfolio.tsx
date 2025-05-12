import { useParams } from "react-router-dom";
import { Loading } from "@/components/ui/loading";
import { Error } from "@/components/ui/error";
import { GradeLevel, GRADE_LEVELS } from "@/constants/grade-subjects";
import { useQuery } from "@tanstack/react-query";
import { AssignmentCard } from "@/components/student/dashboard/AssignmentCard";
import { logger } from "@/lib/logger";
import GridPatternBase from "@/components/ui/grid-pattern";
import StudentCard from "@/components/student/dashboard/StudentDetailCard";
import { getProfileInfo } from "@/api/profiles";
import { getApprovedAssignments } from "@/api/assignment";
import { memo } from "react";
import { usePortfolioPreview } from "@/contexts/PortfolioPreviewContext";

// Define the student profile interface based on Supabase schema
interface StudentProfile {
  id: string;
  full_name: string | null;
  grade: GradeLevel | null;
  school_name: string | null;
  bio: string | null;
  image: string | null;
}

// Error response type
interface ErrorResponse {
  error: boolean;
  message: string;
}

// Type guard for error response
function isErrorResponse(data: unknown): data is ErrorResponse {
  return typeof data === 'object' && data !== null && 'error' in data;
}

// Static grid pattern props
type Square = [number, number];

const GRID_PATTERN_PROPS = {
  width: 20,
  height: 20,
  className: "absolute inset-0",
  squares: [
    [1, 3],
    [2, 1],
    [5, 2],
    [6, 4],
    [8, 1],
  ] as Square[]
};

// Memoized assignment card component
const MemoizedAssignmentCard = memo(AssignmentCard);

interface StudentPortfolioProps {
  previewMode?: boolean;
}

function StudentPortfolio({ previewMode = false }: StudentPortfolioProps) {
  const params = useParams<{ student_id: string }>();
  const { studentId: previewStudentId } = usePortfolioPreview();

  // Use either the preview student ID or the URL param
  const studentId = previewMode ? previewStudentId : params.student_id;

  // Fetch student info (moved to top level)
  const {
    data: studentInfo,
    isLoading: isLoadingStudentInfo,
    error: studentInfoError,
  } = useQuery({
    queryKey: ["studentInfo", studentId],
    queryFn: async () => {
      const response = await getProfileInfo(studentId!);
      if (response.error) {
        throw { name: "ProfileError", message: response.message };
      }
      return response?.data;
    },
    enabled: !!studentId, // Only run if studentId exists
    staleTime: 0, // No caching, always fetch fresh data
    refetchOnMount: "always", // Force refetch on every mount
    select: (data: unknown) => {
      if (isErrorResponse(data)) {
        throw { name: "ProfileError", message: data.message };
      }
      console.log("studentInfo", data);
      return data as StudentProfile;
    }
  });

  // Fetch approved assignments (moved to top level)
  const {
    data: assignments,
    isLoading: isLoadingAssignments,
    error: assignmentsError,
    refetch: refetchAssignments,
    isRefetching,
  } = useQuery({
    queryKey: ["assignments", studentId, "approved"],
    queryFn: () => getApprovedAssignments(studentId!),
    enabled: !!studentId, // Only run if studentId exists
    staleTime: 0, // No caching, always fetch fresh data
    refetchOnMount: "always", // Force refetch on every mount
  });

  if (!studentId) {
    logger.error("No student ID provided", { previewMode });
    return (
      <div className="flex justify-center items-center min-h-dvh">
        <Error message="No student ID provided" />
      </div>
    );
  }

  logger.info(`Rendering StudentPortfolio component`, { studentId, previewMode });

  const isLoading = isLoadingStudentInfo || isLoadingAssignments;
  const isBusy = isLoading || isRefetching;

  if (isLoading) {
    logger.info(`StudentPortfolio is in loading state`, { studentId });
    return (
      <div className="flex justify-center items-center min-h-dvh">
        <Loading text="Loading portfolio..." aria-label="Loading portfolio" />
      </div>
    );
  }

  if (studentInfoError || assignmentsError) {
    logger.error(`StudentPortfolio encountered an error`, {
      studentId,
      studentInfoError,
      assignmentsError,
    });
    return (
      <div className="flex justify-center items-center min-h-dvh">
        <Error
          message="Failed to load portfolio"
          retry={() => refetchAssignments()}
          retryButtonText="Retry"
        />
      </div>
    );
  }

  if (!studentInfo || isErrorResponse(studentInfo)) {
    logger.warn(`No student info found`, { studentId });
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Student Portfolio</h1>
          <p className="text-gray-500 mb-8">No student information available.</p>
        </div>
      </div>
    );
  }

  // If assignments is not an array or is undefined, treat it as empty
  const assignmentList = Array.isArray(assignments) ? assignments : [];

  if (assignmentList.length === 0) {
    logger.info(`No approved assignments found for student`, { studentId });
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">
            {studentInfo.full_name || "Student"}'s Portfolio
          </h1>
          <p className="text-gray-500 mb-8">
            No approved assignments found for this student.
          </p>
        </div>
      </div>
    );
  }

  logger.info(`Rendering portfolio with assignments`, {
    studentId,
    studentName: studentInfo.full_name,
    assignmentCount: assignmentList.length,
  });

  return (
    <div className="relative bg-gray-50 min-h-dvh">
      {/* Grid Pattern Background */}
      <GridPatternBase {...GRID_PATTERN_PROPS} />

      <div className="relative container mx-auto py-8 px-4 space-y-8 flex flex-col min-h-[calc(100vh-8rem)]">
        {/* Student Details Card */}
        <StudentCard
          name={studentInfo.full_name || "Student"}
          className_name={
            studentInfo.grade && Object.values(GRADE_LEVELS).includes(studentInfo.grade)
              ? studentInfo.grade
              : "Update your grade"
          }
          school={studentInfo.school_name || ""}
          imageUrl={studentInfo.image || ""}
          description={
            studentInfo.bio
              ? studentInfo.bio
              : studentInfo.school_name
              ? `Student at ${studentInfo.school_name}`
              : ""
          }
        />

        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          aria-live="polite"
          aria-busy={isBusy}
        >
          {assignmentList.map((assignment) => (
            <MemoizedAssignmentCard
              key={assignment?.id}
              id={assignment?.id}
              title={assignment?.title}
              subject={assignment?.subject}
              grade={assignment?.grade}
              dueDate={new Date(assignment?.due_date).toLocaleDateString()}
              status={assignment?.status}
              imageUrl={assignment?.image_url}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(StudentPortfolio);