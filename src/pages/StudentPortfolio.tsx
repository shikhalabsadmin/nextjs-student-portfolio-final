import { useParams } from "react-router-dom";
import { Loading } from "@/components/ui/loading";
import { Error } from "@/components/ui/error";
import { GradeLevel, Subject } from "@/constants/grade-subjects";
import { useQuery } from "@tanstack/react-query";
import { AssignmentCard } from "@/components/student/dashboard/AssignmentCard";
import { logger } from "@/lib/logger";
import GridPatternBase from "@/components/ui/grid-pattern";
import StudentCard from "@/components/student/dashboard/StudentDetailCard";
import { getProfileInfo } from "@/api/profiles";
import { getApprovedAssignments } from "@/api/assignment";
import { useMemo, memo } from "react";
import { AssignmentStatus } from "@/constants/assignment-status";
import { usePortfolioPreview } from "@/contexts/PortfolioPreviewContext";

// Define types for our data
interface ProfileData {
  full_name?: string;
  grade?: string;
  school?: string;
  [key: string]: unknown;
}

interface AssignmentData {
  id: number;
  title: string;
  subject: Subject;
  grade: GradeLevel;
  due_date: string;
  status: AssignmentStatus;
  image_url?: string;
  [key: string]: unknown;
}

// Type guard to check if data is valid
function isValidProfile(data: unknown): data is ProfileData {
  return data !== null && typeof data === 'object' && !('error' in data);
}

function isValidAssignmentArray(data: unknown): data is AssignmentData[] {
  return Array.isArray(data) && data.every(item => 
    typeof item === 'object' && item !== null && 'id' in item);
}

interface StudentPortfolioProps {
  previewMode?: boolean;
}

// Memoized assignment card component to prevent unnecessary re-renders
const MemoizedAssignmentCard = memo(AssignmentCard);

function StudentPortfolio({ previewMode = false }: StudentPortfolioProps) {
  const params = useParams<{ student_id: string }>();
  const { studentId: previewStudentId } = usePortfolioPreview();
  
  // Use either the preview student ID or the URL param
  const student_id = previewMode ? previewStudentId : params.student_id;

  logger.info(`Rendering StudentPortfolio component`, { student_id, previewMode });

  // Fetch student info
  const {
    data: rawStudentInfo,
    isLoading: isLoadingStudentInfo,
    error: studentInfoError,
  } = useQuery({
    queryKey: ["studentInfo", student_id],
    queryFn: () => getProfileInfo(student_id!),
    enabled: !!student_id,
    staleTime: previewMode ? Infinity : 5 * 60 * 1000, // Cache longer in preview mode
  });

  // Fetch approved assignments
  const {
    data: rawAssignments,
    isLoading: isLoadingAssignments,
    error: assignmentsError,
    refetch: refetchAssignments,
  } = useQuery({
    queryKey: ["assignments", student_id, "approved"],
    queryFn: () => getApprovedAssignments(student_id!),
    enabled: !!student_id,
    staleTime: previewMode ? Infinity : 5 * 60 * 1000, // Cache longer in preview mode
  });

  // Process data with type guards
  const studentInfo = useMemo(() => {
    return isValidProfile(rawStudentInfo) ? rawStudentInfo : { 
      full_name: "Student",
      grade: "Unknown Grade",
      school: "Shikha" 
    };
  }, [rawStudentInfo]);

  const assignments = useMemo(() => {
    return isValidAssignmentArray(rawAssignments) ? rawAssignments : [];
  }, [rawAssignments]);

  const isLoading = useMemo(() => {
    return isLoadingStudentInfo || isLoadingAssignments;
  }, [isLoadingStudentInfo, isLoadingAssignments]);

  const error = useMemo(() => {
    return studentInfoError || assignmentsError;
  }, [studentInfoError, assignmentsError]);

  // Memoize the grid pattern props
  const gridPatternProps = useMemo(() => ({
    width: 20,
    height: 20,
    className: "absolute inset-0",
    squares: [
      [1, 3],
      [2, 1],
      [5, 2],
      [6, 4],
      [8, 1],
    ] as [number, number][]
  }), []);

  if (isLoading) {
    logger.info(`StudentPortfolio is in loading state`, { student_id });
    return (
      <div className="flex justify-center items-center min-h-dvh">
        <Loading text="Loading portfolio..." aria-label="Loading portfolio" />
      </div>
    );
  }

  if (error) {
    logger.error(`StudentPortfolio encountered an error`, {
      student_id,
      error,
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

  if (assignments.length === 0) {
    logger.info(`No approved assignments found for student`, { student_id });
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
    student_id,
    studentName: studentInfo.full_name,
    assignmentCount: assignments.length,
  });

  return (
    <div className="relative bg-gray-50 min-h-dvh">
      {/* Grid Pattern Background */}
      <GridPatternBase {...gridPatternProps} />

      <div className="relative container mx-auto py-8 px-4 space-y-8 flex flex-col min-h-[calc(100vh-8rem)]">
        {/* Student Details Card */}
        <StudentCard
          name={studentInfo.full_name || "Student"}
          className_name={
            studentInfo.grade as GradeLevel || `Update your grade`
          }
          school={studentInfo.school || "Shikha"}
          imageUrl=""
          description={"Student at Shikha"}
        />

        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          aria-live="polite"
          aria-busy={isLoading}
        >
          {assignments.map((assignment) => (
            <MemoizedAssignmentCard
              key={assignment.id}
              id={assignment.id}
              title={assignment.title}
              subject={assignment.subject}
              grade={assignment.grade}
              dueDate={new Date(assignment.due_date).toLocaleDateString()}
              status={assignment.status}
              imageUrl={assignment.image_url}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Export a memoized version of the component
export default memo(StudentPortfolio);
