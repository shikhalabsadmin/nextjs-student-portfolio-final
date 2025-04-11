import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StudentAssignment } from "@/types/student-dashboard";
import { EnhancedUser } from "./useAuthState";
import { getGradeAssignments } from "@/utils/student-dashboard-utils";
import { GradeLevel } from "@/constants/grade-subjects";
import { AssignmentStatus } from "@/constants/assignment-status";
import { Subject } from "@/constants/grade-subjects";
import { ROUTES } from "@/config/routes";
import { useNavigate } from "react-router-dom";

interface AssignmentRecord {
  id: number;
  title: string;
  subject: Subject;
  grade: string;
  due_date: string;
  status: AssignmentStatus;
  image_url?: string;
  student_id: string;
}

interface UseStudentAssignmentsResult {
  assignments: StudentAssignment[];
  isLoading: boolean;
  error: string | null;
  deleteAssignment: (assignmentId: number) => Promise<void>;
  editAssignment: (assignmentId: number) => void;
  refetch: () => Promise<void>;
}

export function useStudentAssignments(
  user: EnhancedUser
): UseStudentAssignmentsResult {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("assignments")
        .select("*")
        .eq("student_id", user.id)
        .order('updated_at', { ascending: false });

      console.log("fetchAssignments", { data, fetchError });

      if (fetchError) {
        throw fetchError;
      }

      // Transform the data to match StudentAssignment interface
      const transformedAssignments: StudentAssignment[] = (
        data as AssignmentRecord[]
      ).map((item) => ({
        id: item.id,
        title: item.title,
        subject: item.subject,
        grade: item.grade as GradeLevel,
        dueDate: item.due_date,
        status: item.status,
        imageUrl: item.image_url || "/broken-image.png",
      }));

      console.log("fetchAssignments", {
        data,
        transformedAssignments,
      });

      setAssignments(transformedAssignments);
    } catch (err) {
      console.error("Error fetching assignments:", err);
      setError("Failed to load assignments. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const deleteAssignment = async (assignmentId: number) => {
    try {
      const { error: deleteError } = await supabase
        .from("assignments")
        .delete()
        .eq("id", assignmentId)
        .eq("student_id", user.id);

      if (deleteError) {
        throw deleteError;
      }

      // Update state by filtering out the deleted assignment
      setAssignments((current) => current.filter((a) => a.id !== assignmentId));
    } catch (err) {
      console.error("Error deleting assignment:", err);
      setError("Failed to delete assignment. Please try again later.");
    }
  };

  const editAssignment = (assignmentId: number) => {
    const path = ROUTES.STUDENT.MANAGE_ASSIGNMENT.replace(':id?', assignmentId.toString());
    console.log("editAssignment", path);
    navigate(path);
  };

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  return {
    assignments,
    isLoading,
    error,
    deleteAssignment,
    editAssignment,
    refetch: fetchAssignments,
  };
}
