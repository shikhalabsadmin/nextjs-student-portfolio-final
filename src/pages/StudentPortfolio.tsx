import { useParams } from "react-router-dom";
import { Loading } from "@/components/ui/loading";
import { Error } from "@/components/ui/error";
import { GradeLevel, GRADE_LEVELS, Subject } from "@/constants/grade-subjects";
import { useQuery } from "@tanstack/react-query";
import { AssignmentCard } from "@/components/student/dashboard/AssignmentCard";
import GridPatternBase from "@/components/ui/grid-pattern";
import StudentCard from "@/components/student/dashboard/StudentDetailCard";
import { getProfileInfo } from "@/api/profiles";
import { getApprovedAssignments } from "@/api/assignment";
import { getFilesForMultipleAssignments } from "@/api/assignment-files";
import { memo, useMemo, useCallback } from "react";
import { usePortfolioPreview } from "@/contexts/PortfolioPreviewContext";
import { AssignmentStatus } from "@/constants/assignment-status";
import { logger } from "@/lib/logger";

/**
 * StudentPortfolio Component
 * 
 * This component displays a student's portfolio with their profile information and
 * a collection of their approved assignments. It handles loading states, error cases,
 * and optimizes performance through memoization and caching strategies.
 * 
 * Data flow:
 * 1. Fetch student profile info
 * 2. Fetch approved assignments for the student
 * 3. Fetch associated files for assignments (primarily images)
 * 4. Combine this data into a displayable format
 * 
 * @author Your Team
 * @lastModified 2023-10-15
 */

// ===== Type Definitions =====

/**
 * Student profile data from the database
 * Contains personal information and preferences
 */
interface StudentProfile {
  id: string;
  full_name: string | null;
  grade: GradeLevel | null;
  school_name: string | null;
  bio: string | null;
  image: string | null;
}

/**
 * Assignment data including metadata and status
 * This is the core data structure for assignments
 */
interface AssignmentData {
  id: number;
  title: string;
  subject: Subject;
  grade: GradeLevel;
  due_date: string;
  status: AssignmentStatus;
  image_url?: string; // Optional - will be populated from files data
  student_id: string;
  updated_at: string;
}

/**
 * File record associated with assignments
 * Used for displaying images and other attachments
 */
interface FileRecord {
  assignment_id: number;
  file_type: string;
  file_url: string;
  id: number;
}

/**
 * Props for the StudentPortfolio component
 * previewMode - If true, gets studentId from context instead of URL
 */
interface StudentPortfolioProps {
  previewMode?: boolean;
}

// ===== Constants & Memoized Components =====

// Required for the grid pattern component
type Square = [number, number];

/**
 * Grid pattern configuration - memoized to prevent recalculation
 * This decorative pattern appears in the background of the portfolio
 */
const GRID_PATTERN_PROPS = {
  width: 20,
  height: 20,
  className: "absolute inset-0",
  squares: [[1, 3], [2, 1], [5, 2], [6, 4], [8, 1]] as Square[]
};

// Memoize components to prevent unnecessary re-renders
const MemoizedAssignmentCard = memo(AssignmentCard);
const MemoizedStudentCard = memo(StudentCard);

/**
 * StudentPortfolio Component Implementation
 * 
 * This component retrieves and displays a student's portfolio data.
 * It handles various states (loading, error, empty) and optimizes
 * data fetching with React Query.
 */
function StudentPortfolio({ previewMode = false }: StudentPortfolioProps) {
  // ===== Setup & Configuration =====
  
  // Get student ID either from URL or preview context
  const params = useParams<{ student_id: string }>();
  const { studentId: previewStudentId, closePreview } = usePortfolioPreview();
  const studentId = previewMode ? previewStudentId : params.student_id;

  logger.info(`Initializing StudentPortfolio component`, { studentId, previewMode });

  // ===== Data Fetching =====

  /**
   * Fetch student profile information
   * 
   * Always fetches fresh data without caching to ensure up-to-date information.
   * We use an explicit error handler to maintain type safety.
   */
  const {
    data: studentInfo,
    isLoading: isLoadingStudentInfo,
    error: studentInfoError,
  } = useQuery({
    queryKey: ["studentInfo", studentId],
    queryFn: async () => {
      const response = await getProfileInfo(studentId!);
      if (response.error) {
        throw response.message;
      }
      return response?.data as unknown as StudentProfile;
    },
    enabled: !!studentId, // Only run if studentId exists
    refetchOnMount: "always", // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  /**
   * Fetch approved assignments for this student
   * 
   * Always fetches fresh data to ensure assignments are up-to-date.
   * This ensures we always have the latest assignment status and information.
   */
  const {
    data: assignmentsData,
    isLoading: isLoadingAssignments,
    error: assignmentsError,
    refetch: refetchAssignments,
    isRefetching,
  } = useQuery({
    queryKey: ["assignments", studentId, "approved"],
    queryFn: () => getApprovedAssignments(studentId!),
    enabled: !!studentId,
    refetchOnMount: "always", // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    select: (data: unknown) => Array.isArray(data) ? data as AssignmentData[] : []
  });

  // Extract assignment IDs for file fetching
  const assignmentIds = useMemo(() => 
    (assignmentsData || []).map(a => a.id), 
    [assignmentsData]
  );

  // Convert numeric IDs to strings for the API - avoids recreating on every render
  const stringIds = useMemo(() => 
    assignmentIds.map(id => id.toString()),
    [assignmentIds]
  );

  /**
   * Fetch files associated with the assignments
   * 
   * Always fetches fresh file data to ensure we have the latest files.
   * This is important for seeing the most recent uploads or changes.
   */
  const {
    data: filesData,
    isLoading: isLoadingFiles,
  } = useQuery({
    queryKey: ["assignmentFiles", stringIds],
    queryFn: () => {
      return getFilesForMultipleAssignments(stringIds, studentId!);
    },
    enabled: !!studentId && stringIds.length > 0, // Only run if we have assignments
    refetchOnMount: "always", // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    select: (data: unknown) => Array.isArray(data) ? data as FileRecord[] : []
  });

  // ===== Data Processing =====

  /**
   * Creates a map of assignment IDs to their image URLs
   * Extracted to a separate function for better memoization
   * 
   * @param files - Array of file records to process
   * @returns Map of assignment IDs to image URLs
   */
  const createImageMap = useCallback((files: FileRecord[]) => {
    const map = new Map<number, string>();
    
    if (files && files.length > 0) {
      files.forEach((file: FileRecord) => {
        // Only store the first image found for each assignment
        if (
          file?.file_type?.startsWith("image") && 
          !map.has(file.assignment_id) &&
          file.file_url
        ) {
          map.set(file.assignment_id, file.file_url);
        }
      });
    }
    
    return map;
  }, []);

  /**
   * Process assignment data with image URLs
   * 
   * This combines assignment data with the appropriate image URLs
   * from the files data. It's memoized to prevent unnecessary recalculation.
   */
  const assignments = useMemo(() => {
    logger.debug('Processing assignments with images', { assignmentCount: assignmentsData?.length || 0 });
    if (!assignmentsData || !Array.isArray(assignmentsData)) return [];
    
    // Create image map for faster lookups using memoized function
    const imageMap = createImageMap(filesData || []);
    
    // Add image URLs to assignments
    return assignmentsData.map(item => ({
      ...item,
      image_url: imageMap.get(item.id) || "/studemt-assignment-default-image.png" // Default image fallback
    }));
  }, [assignmentsData, filesData, createImageMap]);

  // Memoize retry function to avoid recreation on render
  const handleRetry = useCallback(() => refetchAssignments(), [refetchAssignments]);

  /**
   * Generate student description text based on available data
   * Handles empty cases gracefully
   */
  const studentDescription = useMemo(() => {
    if (!studentInfo) return "";
    if (studentInfo.bio) return studentInfo.bio;
    if (studentInfo.school_name) return `Student at ${studentInfo.school_name}`;
    return "";
  }, [studentInfo]);

  /**
   * Handle assignment card click
   * If in preview mode, close the preview
   */
  const handleAssignmentClick = useCallback((assignmentId: number) => {
    logger.info(`Assignment card clicked`, { assignmentId, previewMode });
    if (previewMode && closePreview) {
      closePreview();
    }
    // Additional click handling logic can be added here
  }, [previewMode, closePreview]);

  // ===== Derived State =====
  
  // Aggregate loading states for cleaner conditionals
  const isLoading = isLoadingStudentInfo || isLoadingAssignments || isLoadingFiles;
  const isBusy = isLoading || isRefetching;
  const assignmentList = assignments || [];

  // ===== Render Logic =====

  // Handle missing student ID - this is a critical error
  if (!studentId) {
    logger.error("No student ID provided", { previewMode });
    return (
      <div className="flex justify-center items-center min-h-dvh">
        <Error message="No student ID provided" />
      </div>
    );
  }

  // Show loading state while data is being fetched
  if (isLoading) {
    logger.info(`StudentPortfolio is in loading state`, { studentId });
    return (
      <div className="flex justify-center items-center min-h-dvh">
        <Loading text="Loading portfolio..." aria-label="Loading portfolio" />
      </div>
    );
  }

  // Handle API errors gracefully with retry option
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
          retry={handleRetry}
          retryButtonText="Retry"
        />
      </div>
    );
  }

  // Handle case where student info isn't found
  if (!studentInfo) {
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

  // Handle case where student has no approved assignments
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

  // Main portfolio rendering with student info and assignment grid
  return (
    <div className="relative bg-gray-50 min-h-dvh">
      {/* Decorative background grid pattern */}
      <GridPatternBase {...GRID_PATTERN_PROPS} />

      <div className="relative container mx-auto py-8 px-4 space-y-8 flex flex-col min-h-[calc(100vh-8rem)]">
        {/* Student profile card with personal information */}
        <MemoizedStudentCard
          name={studentInfo.full_name || "Student"}
          className_name={
            studentInfo.grade && Object.values(GRADE_LEVELS).includes(studentInfo.grade)
              ? studentInfo.grade
              : "Update your grade"
          }
          school={studentInfo.school_name || ""}
          imageUrl={studentInfo.image || ""}
          description={studentDescription}
        />

        {/* Assignment grid - responsive layout with accessibility attributes */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          aria-live="polite"
          aria-busy={isBusy}
        >
          {assignmentList.map((assignment) => (
            <div 
              key={assignment?.id}
              onClick={() => handleAssignmentClick(assignment.id)}
              className={previewMode ? "cursor-pointer" : ""}
            >
              <MemoizedAssignmentCard
                id={assignment?.id}
                title={assignment?.title}
                subject={assignment?.subject}
                grade={assignment?.grade}
                dueDate={new Date(assignment?.due_date).toLocaleDateString()}
                status={assignment?.status}
                imageUrl={assignment?.image_url}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export default memo(StudentPortfolio);