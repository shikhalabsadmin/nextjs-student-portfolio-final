import { useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ASSIGNMENT_STATUS } from "@/constants/assignment-status";
import { ROUTES } from "@/config/routes";
import { Loading } from "@/components/ui/loading";
import { Error } from "@/components/ui/error";
import { Subject } from "@/constants/grade-subjects";
import { GradeLevel } from "@/constants/grade-subjects";
import { useQuery } from "@tanstack/react-query";
import { AssignmentCard } from "@/components/student/dashboard/AssignmentCard";
import { AssignmentStatus } from "@/constants/assignment-status";
import { logger } from "@/lib/logger";
import GridPatternBase from "@/components/ui/grid-pattern";
import StudentCard from "@/components/student/dashboard/StudentDetailCard";

interface PortfolioAssignment {
  id: number;
  title: string;
  subject: Subject;
  grade: GradeLevel;
  due_date: string;
  status: AssignmentStatus;
  image_url?: string;
  created_at: string;
}

interface StudentInfo {
  name: string;
  school: string;
  grade: string;
}

async function fetchStudentInfo(studentId: string): Promise<StudentInfo> {
  logger.info(`Fetching student info for studentId: ${studentId}`);

  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, grade")
    .eq("id", studentId)
    .single();

  if (error) {
    logger.error(`Error fetching student info`, { studentId, error });
    throw error;
  }

  logger.debug(`Student info fetched successfully`, { studentId });
  return {
    name: data.full_name || "Student",
    school: "Shikha",
    grade: data.grade || "Unknown Grade",
  };
}

async function fetchApprovedAssignments(
  studentId: string
): Promise<PortfolioAssignment[]> {
  logger.info(`Fetching approved assignments for studentId: ${studentId}`);

  const { data, error } = await supabase
    .from("assignments")
    .select("*")
    .eq("student_id", studentId)
    .eq("status", ASSIGNMENT_STATUS.APPROVED)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error(`Error fetching approved assignments`, { studentId, error });
    throw error;
  }

  logger.debug(`Approved assignments fetched successfully`, {
    studentId,
    count: data?.length || 0,
  });

  return data as PortfolioAssignment[];
}

export default function StudentPortfolio() {
  const { student_id } = useParams<{ student_id: string }>();

  logger.info(`Rendering StudentPortfolio component`, { student_id });

  // Fetch student info
  const {
    data: studentInfo,
    isLoading: isLoadingStudentInfo,
    error: studentInfoError,
  } = useQuery({
    queryKey: ["studentInfo", student_id],
    queryFn: () => {
      try {
        return fetchStudentInfo(student_id!);
      } catch (error) {
        logger.error(`Error in studentInfo query`, { student_id, error });
        throw error;
      }
    },
    enabled: !!student_id,
  });

  // Fetch approved assignments
  const {
    data: assignments = [],
    isLoading: isLoadingAssignments,
    error: assignmentsError,
    refetch: refetchAssignments,
  } = useQuery({
    queryKey: ["assignments", student_id, "approved"],
    queryFn: () => {
      try {
        return fetchApprovedAssignments(student_id!);
      } catch (error) {
        logger.error(`Error in assignments query`, { student_id, error });
        throw error;
      }
    },
    enabled: !!student_id,
  });

  const isLoading = isLoadingStudentInfo || isLoadingAssignments;
  const error = studentInfoError || assignmentsError;

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
            {studentInfo?.name}'s Portfolio
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
    studentName: studentInfo?.name,
    assignmentCount: assignments.length,
  });

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

      <div className="relative container mx-auto py-8 px-4 space-y-8 flex flex-col min-h-[calc(100vh-8rem)]">
        {/* Student Details Card */}
        <StudentCard
          name={(studentInfo?.name as string) || "Student"}
          className_name={
            (studentInfo?.grade as GradeLevel) || `Update your grade`
          }
          school={(studentInfo?.school as string) || "Shikha"}
          imageUrl=""
          description={"Student at Shikha"}
        />

        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          aria-live="polite"
          aria-busy={isLoading}
        >
          {assignments.map((assignment) => (
            <AssignmentCard
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
