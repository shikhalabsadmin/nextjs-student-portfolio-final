// External dependencies
import { memo, useMemo, useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Backpack, GraduationCap } from 'lucide-react';

// Internal dependencies
import { Loading } from "@/components/ui/loading";
import { Error } from "@/components/ui/error";
import { AssignmentCard } from "@/components/student/dashboard/AssignmentCard";
import GridPatternBase from "@/components/ui/grid-pattern";
import { usePortfolioPreview } from "@/contexts/PortfolioPreviewContext";
import { GradeLevel, GRADE_LEVELS, Subject } from "@/constants/grade-subjects";
import { AssignmentStatus } from "@/constants/assignment-status";
import { getProfileInfo } from "@/api/profiles";
import { getApprovedAssignments } from "@/api/assignment";
import { getFilesForMultipleAssignments } from "@/api/assignment-files";
import { logger } from "@/lib/logger";

// ===== Type Definitions =====

interface StudentProfile {
  id: string;
  full_name: string | null;
  grade: GradeLevel | null;
  school_name: string | null;
  bio: string | null;
  image: string | null;
}

interface AssignmentData {
  id: number;
  title: string;
  subject: Subject;
  grade: GradeLevel;
  due_date: string;
  status: AssignmentStatus;
  image_url?: string;
  student_id: string;
  updated_at: string;
}

interface FileRecord {
  assignment_id: number;
  file_type: string;
  file_url: string;
  id: number;
}

interface StudentPortfolioProps {
  previewMode?: boolean;
}

type Square = [number, number];

// ===== Constants =====

const GRID_PATTERN_PROPS = {
  width: 20,
  height: 20,
  className: "absolute inset-0",
  squares: [[1, 3], [2, 1], [5, 2], [6, 4], [8, 1]] as Square[]
};

const MemoizedAssignmentCard = memo(AssignmentCard);

// ===== Component =====

/**
 * Student portfolio displaying profile information and approved assignments.
 * Supports preview mode for in-app previews.
 */
function StudentPortfolio({ previewMode = false }: StudentPortfolioProps) {
  const [imageError, setImageError] = useState(false);
  
  const params = useParams<{ student_id: string }>();
  const { studentId: previewStudentId, closePreview } = usePortfolioPreview();
  const studentId = previewMode ? previewStudentId : params.student_id;

  logger.info(`Initializing StudentPortfolio component`, { studentId, previewMode });

  // Fetch student profile
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
    enabled: !!studentId,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  // Fetch approved assignments
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
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    select: (data: unknown) => Array.isArray(data) ? data as AssignmentData[] : []
  });

  const assignmentIds = useMemo(() => 
    (assignmentsData || []).map(a => a.id), 
    [assignmentsData]
  );

  const stringIds = useMemo(() => 
    assignmentIds.map(id => id.toString()),
    [assignmentIds]
  );

  // Fetch assignment files (primarily images)
  const {
    data: filesData,
    isLoading: isLoadingFiles,
  } = useQuery({
    queryKey: ["assignmentFiles", stringIds],
    queryFn: () => getFilesForMultipleAssignments(stringIds, studentId!),
    enabled: !!studentId && stringIds.length > 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    select: (data: unknown) => Array.isArray(data) ? data as FileRecord[] : []
  });

  // Map assignment IDs to their first image URL
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

  // Combine assignments with their image URLs
  const assignments = useMemo(() => {
    logger.debug('Processing assignments with images', { assignmentCount: assignmentsData?.length || 0 });
    if (!assignmentsData || !Array.isArray(assignmentsData)) return [];
    
    const imageMap = createImageMap(filesData || []);
    
    return assignmentsData.map(item => ({
      ...item,
      image_url: imageMap.get(item.id) || "/studemt-assignment-default-image.png"
    }));
  }, [assignmentsData, filesData, createImageMap]);

  const handleRetry = useCallback(() => refetchAssignments(), [refetchAssignments]);

  const studentDescription = useMemo(() => {
    if (!studentInfo) return "";
    if (studentInfo.bio) return studentInfo.bio;
    if (studentInfo.school_name) return `Student at ${studentInfo.school_name}`;
    return "";
  }, [studentInfo]);

  const handleAssignmentClick = useCallback((assignmentId: number) => {
    logger.info(`Assignment card clicked`, { assignmentId, previewMode });
    if (previewMode && closePreview) {
      closePreview();
    }
  }, [previewMode, closePreview]);

  const isLoading = isLoadingStudentInfo || isLoadingAssignments || isLoadingFiles;
  const isBusy = isLoading || isRefetching;
  const assignmentList = assignments || [];

  // Early returns for error states
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

  // Display values with fallbacks
  const showInitial = !studentInfo?.image || imageError;
  const displayName = studentInfo.full_name || "Student";
  const displayGrade = studentInfo.grade && Object.values(GRADE_LEVELS).includes(studentInfo.grade)
    ? studentInfo.grade
    : "Update your grade";
  const displaySchool = studentInfo.school_name || "";

  return (
    <div className="relative min-h-screen bg-white">
      <GridPatternBase {...GRID_PATTERN_PROPS} />

      <div className="container mx-auto px-4 pt-8">
        <div className="h-20 w-20 overflow-hidden rounded-full border border-slate-300">
          {showInitial ? (
            <div className="h-full w-full flex items-center justify-center bg-transparent text-primary text-2xl font-semibold">
              {displayName.charAt(0).toUpperCase()}
            </div>
          ) : (
            <img
              src={studentInfo.image!}
              alt={`${displayName}'s profile picture`}
              className="object-cover h-full w-full"
              onError={() => setImageError(true)}
            />
          )}
        </div>
      </div>

      <div className="absolute left-0 right-0 top-[128px] bottom-0 bg-gradient-to-b from-gray-50 via-gray-100 to-white"></div>

      <div className="relative container mx-auto px-4">
        <h3 className="mt-5 text-3xl font-bold text-gray-900 tracking-tight">{displayName}</h3>

        <div className="mt-4 flex flex-wrap items-center gap-6">
          {displayGrade && (
            <div className="flex items-center gap-1 text-slate-700">
              <Backpack className="h-4 w-4" />
              <span>{displayGrade}</span>
            </div>
          )}
          {displaySchool && (
            <div className="flex items-center gap-1 text-slate-700">
              <GraduationCap className="h-4 w-4" />
              <span>{displaySchool}</span>
            </div>
          )}
        </div>

        {studentDescription && (
          <p className="mt-4 text-base text-gray-900 leading-relaxed">{studentDescription}</p>
        )}

        <div
          className="mt-36 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8"
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
                id={assignment?.id.toString()}
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

export default memo(StudentPortfolio);