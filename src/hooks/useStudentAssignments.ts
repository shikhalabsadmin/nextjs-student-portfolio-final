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
import { toast } from "sonner";

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
      // Fetch assignments with RLS applied through user.id
      const { data, error: fetchError } = await supabase
        .from("assignments")
        .select("*")
        .eq("student_id", user.id)
        .order('updated_at', { ascending: false });

      if (fetchError) {
        console.error("Error fetching assignments:", fetchError);
        toast.error("Error fetching assignments");
        setError("Failed to load assignments");
        return;
      }

      if (!data || data?.length === 0) {
        setAssignments([]);
        setIsLoading(false);
        return;
      }

      // Get all assignment IDs to use in file query
      const assignmentIds = data.map(assignment => assignment.id);

      // Fetch only files for these assignments
      // Select only needed fields to reduce payload size
      const { data: filesData, error: filesError } = await supabase
        .from("assignment_files")
        .select("assignment_id, file_url, file_type, updated_at, created_at")
        .eq("student_id", user.id)
        .in("assignment_id", assignmentIds)
        .order('updated_at', { ascending: false });

      if (filesError) {
        console.error("Error fetching assignment files:", filesError);
        toast.error("Error fetching assignment files");
        // Continue without files
      }

      // Create lookup map for faster file access - use only image files
      const assignmentImageMap = new Map();
      
      // Process files - already sorted by updated_at from query
      filesData?.forEach(file => {
        // Only process files that are images and not already in map
        if (
          file?.file_type?.startsWith("image") && 
          !assignmentImageMap.has(file.assignment_id) &&
          file.file_url
        ) {
          assignmentImageMap.set(file.assignment_id, file.file_url);
        }
      });

      // Transform the data with optimized file lookup
      const transformedAssignments: StudentAssignment[] = data.map((item) => ({
        id: item.id,
        title: item.title,
        subject: item.subject,
        grade: item.grade as GradeLevel,
        dueDate: item.due_date,
        status: item.status,
        imageUrl: assignmentImageMap.get(item.id) || "/broken-image.png",
      }));

      setAssignments(transformedAssignments);
    } catch (err) {
      console.error("Error in fetchAssignments:", err);
      setError("Failed to load assignments. Please try again later.");
      toast.error("Something went wrong while loading assignments");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const deleteAssignment = async (assignmentId: number) => {
    // Prevent deletion if already loading
    if (isLoading) return;
    
    const toastId = toast.loading("Deleting assignment...");
    setIsLoading(true);
    
    try {
      // First fetch all files associated with this assignment
      // Only select fields we need
      const { data: files, error: filesError } = await supabase
        .from("assignment_files")
        .select("file_url")
        .eq("assignment_id", assignmentId)
        .eq("student_id", user.id);
        
      if (filesError) {
        console.error("Error fetching files for deletion:", filesError);
        // Continue with deletion even if file fetch fails
      }
      
      // If there are files to delete
      if (files && files.length > 0) {
        // Extract file paths for storage deletion
        const filePaths = files
          .map(file => {
            const url = file.file_url;
            // Get the filename from the URL, typically the last part after the last '/'
            return url ? url.split("/").pop() : null;
          })
          .filter(Boolean) as string[];
        
        // Delete files from storage in batch if we have paths
        if (filePaths.length > 0) {
          const { error: storageError } = await supabase.storage
            .from("assignments")
            .remove(filePaths);
            
          if (storageError) {
            console.error("Error deleting files from storage:", storageError);
            // Continue with deletion process
          }
        }
      }
      
      // Use a transaction to ensure both operations succeed or fail together
      const { error: transactionError } = await supabase.rpc('delete_assignment_with_files', {
        p_assignment_id: assignmentId,
        p_student_id: user.id
      });
      
      if (transactionError) {
        // If RPC function not available, fall back to separate operations
        console.warn("RPC function failed, falling back to separate operations:", transactionError);
        
        // Delete files first (foreign key constraint)
        const { error: fileDeleteError } = await supabase
          .from("assignment_files")
          .delete()
          .eq("assignment_id", assignmentId)
          .eq("student_id", user.id);
          
        if (fileDeleteError) {
          console.error("Error deleting file records:", fileDeleteError);
          // Continue with assignment deletion
        }
        
        // Then delete the assignment
        const { error: deleteError } = await supabase
          .from("assignments")
          .delete()
          .eq("id", assignmentId)
          .eq("student_id", user.id);

        if (deleteError) {
          toast.dismiss(toastId);
          toast.error("Failed to delete assignment");
          throw deleteError;
        }
      }

      // Update local state
      setAssignments((current) => current.filter((a) => a.id !== assignmentId));
      
      toast.dismiss(toastId);
      toast.success("Assignment deleted successfully");
    } catch (err) {
      console.error("Error deleting assignment:", err);
      setError("Failed to delete assignment. Please try again later.");
      toast.dismiss(toastId);
      toast.error("Failed to delete assignment");
    } finally {
      setIsLoading(false);
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
