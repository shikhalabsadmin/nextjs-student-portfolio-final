// External dependencies
import { memo, useMemo, useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

// Internal dependencies
import { Loading } from "@/components/ui/loading";
import { Error } from "@/components/ui/error";
import GridPatternBase from "@/components/ui/grid-pattern";
import StudentPortfolioView from "@/components/student-portfolio";
import { usePortfolioPreview } from "@/contexts/PortfolioPreviewContext";
import { GRADE_LEVELS } from "@/constants/grade-subjects";
import { getProfileInfo } from "@/api/profiles";
import { getApprovedAssignments } from "@/api/assignment";
import { getFilesForMultipleAssignments } from "@/api/assignment-files";
import { logger } from "@/lib/logger";
import { STUDENT_PORTFOLIO_KEYS } from "@/query-key/student-portfolio";

// Types
import {
  StudentProfile,
  PortfolioAssignment,
  FileRecord,
} from "@/types/student-portfolio";

// ===== Constants =====

type Square = [number, number];

const GRID_PATTERN_PROPS = {
  width: 20,
  height: 20,
  className: "absolute inset-0",
  squares: [[1, 3], [2, 1], [5, 2], [6, 4], [8, 1]] as Square[],
};

// ===== Props =====

interface StudentPortfolioProps {
  previewMode?: boolean;
}

// ===== Component =====

/**
 * StudentPortfolio - Container component that manages state and data
 * 
 * Responsibilities:
 * - Fetch student profile, assignments, and files via useQuery
 * - Process and combine data (assignments with images)
 * - Handle loading, error, and empty states
 * - Pass processed data to StudentPortfolioView
 * 
 * Data Flow:
 * ┌─────────────────────────────────────────────┐
 * │  URL Params → studentId                     │
 * │  useQuery → studentInfo, assignments, files │
 * │  useMemo → processed assignments            │
 * │  ↓                                          │
 * │  <StudentPortfolioView {...props} />        │
 * └─────────────────────────────────────────────┘
 */
function StudentPortfolio({ previewMode = false }: StudentPortfolioProps) {
  // ===== State =====
  const [imageError, setImageError] = useState(false);

  // ===== URL Params & Context =====
  const params = useParams<{ student_id: string }>();
  const { studentId: previewStudentId, closePreview } = usePortfolioPreview();
  const studentId = previewMode ? previewStudentId : params.student_id;

  logger.info(`Initializing StudentPortfolio component`, { studentId, previewMode });

  // ===== API: Fetch Student Profile =====
  const {
    data: studentInfo,
    isLoading: isLoadingStudentInfo,
    error: studentInfoError,
  } = useQuery({
    queryKey: STUDENT_PORTFOLIO_KEYS.studentInfo(studentId!),
    queryFn: async () => {
      const response = await getProfileInfo(studentId!);
      if (response.error) {
        throw response.message;
      }
      return response?.data as unknown as StudentProfile;
    },
    enabled: !!studentId,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  // ===== API: Fetch Approved Assignments =====
  const {
    data: assignmentsData,
    isLoading: isLoadingAssignments,
    error: assignmentsError,
    refetch: refetchAssignments,
    isRefetching,
  } = useQuery({
    queryKey: STUDENT_PORTFOLIO_KEYS.approvedAssignments(studentId!),
    queryFn: () => getApprovedAssignments(studentId!),
    enabled: !!studentId,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    select: (data: unknown) =>
      Array.isArray(data) ? (data as PortfolioAssignment[]) : [],
  });

  // ===== Derived: Assignment IDs =====
  const assignmentIds = useMemo(
    () => (assignmentsData || []).map((a) => a.id),
    [assignmentsData]
  );

  const stringIds = useMemo(
    () => assignmentIds.map((id) => id.toString()),
    [assignmentIds]
  );

  // ===== API: Fetch Assignment Files =====
  const { data: filesData, isLoading: isLoadingFiles } = useQuery({
    queryKey: STUDENT_PORTFOLIO_KEYS.assignmentFiles(stringIds),
    queryFn: () => getFilesForMultipleAssignments(stringIds, studentId!),
    enabled: !!studentId && stringIds.length > 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    select: (data: unknown) =>
      Array.isArray(data) ? (data as FileRecord[]) : [],
  });

  // ===== Data Processing: Create Image Map =====
  const createImageMap = useCallback((files: FileRecord[]) => {
    const map = new Map<number, string>();

    if (files && files.length > 0) {
      files.forEach((file: FileRecord) => {
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

  // ===== Data Processing: Combine Assignments with Images =====
  const assignments = useMemo(() => {
    logger.debug("Processing assignments with images", {
      assignmentCount: assignmentsData?.length || 0,
    });
    if (!assignmentsData || !Array.isArray(assignmentsData)) return [];

    const imageMap = createImageMap(filesData || []);

    return assignmentsData.map((item) => ({
      ...item,
      image_url: imageMap.get(item.id) || "/studemt-assignment-default-image.png",
    }));
  }, [assignmentsData, filesData, createImageMap]);

  // ===== Derived: Student Description =====
  const studentDescription = useMemo(() => {
    if (!studentInfo) return "";
    if (studentInfo.bio) return studentInfo.bio;
    if (studentInfo.school_name) return `Student at ${studentInfo.school_name}`;
    return "";
  }, [studentInfo]);

  // ===== Callbacks =====
  const handleRetry = useCallback(() => refetchAssignments(), [refetchAssignments]);

  const handleAssignmentClick = useCallback(
    (assignmentId: number) => {
      logger.info(`Assignment card clicked`, { assignmentId, previewMode });
      if (previewMode && closePreview) {
        closePreview();
      }
    },
    [previewMode, closePreview]
  );

  const handleImageError = useCallback(() => setImageError(true), []);

  // ===== Derived: Loading & Display States =====
  const isLoading = isLoadingStudentInfo || isLoadingAssignments || isLoadingFiles;
  const isBusy = isLoading || isRefetching;
  const assignmentList = assignments || [];

  // Display values with fallbacks
  const showInitial = !studentInfo?.image || imageError;
  const displayName = studentInfo?.full_name || "Student";
  const displayGrade =
    studentInfo?.grade && Object.values(GRADE_LEVELS).includes(studentInfo.grade)
      ? studentInfo.grade
      : "Update your grade";
  const displaySchool = studentInfo?.school_name || "";

  // ===== Early Returns: Error States =====
  if (!studentId) {
    logger.error("No student ID provided", { previewMode });
    return (
      <div className="flex justify-center items-center min-h-dvh">
        <Error message="No student ID provided" />
      </div>
    );
  }

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
          retry={handleRetry}
          retryButtonText="Retry"
        />
      </div>
    );
  }

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

  // ===== Main Render =====
  return (
    <div className="relative min-h-screen bg-white">
      {/* Background Pattern (stays in parent) */}
      <GridPatternBase {...GRID_PATTERN_PROPS} />

      {/* Portfolio View (UI components) */}
      <StudentPortfolioView
        // Avatar props
        image={studentInfo.image}
        name={displayName}
        showInitial={showInitial}
        onImageError={handleImageError}
        // Info props
        grade={displayGrade}
        schoolName={displaySchool}
        // Bio props
        bio={studentDescription}
        // Grid props
        assignments={assignmentList}
        isBusy={isBusy}
        onAssignmentClick={handleAssignmentClick}
        previewMode={previewMode}
      />
    </div>
  );
}

export default memo(StudentPortfolio);