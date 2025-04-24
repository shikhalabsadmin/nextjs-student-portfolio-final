import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  useQuery, 
  useMutation, 
  useQueryClient
} from "@tanstack/react-query";

import { StudentAssignment } from "@/types/student-dashboard";
import { EnhancedUser } from "@/hooks/useAuthState";
import { GradeLevel, Subject } from "@/constants/grade-subjects";
import { AssignmentStatus } from "@/constants/assignment-status";
import { ROUTES } from "@/config/routes";
import { getAssignments, deleteAssignment as apiDeleteAssignment } from "@/api/assignment";
import { getFilesForMultipleAssignments } from "@/api/assignment-files";

// Basic types for our data structure
interface AssignmentRecord {
  id: number;
  title: string;
  subject: Subject;
  grade: string;
  due_date: string;
  status: AssignmentStatus;
  image_url?: string;
  student_id: string;
  updated_at: string;
}

// File record type for assignment files
interface FileRecord {
  assignment_id: number;
  file_type: string;
  file_url: string;
  id: number;
}

// Error type for better error handling
type AssignmentError = {
  type: 'auth' | 'fetch' | 'files' | 'transform' | 'network';
  message: string;
  originalError?: unknown;
};

// Define the hook return type
interface UseStudentAssignmentsResult {
  assignments: StudentAssignment[];
  isLoading: boolean;
  isRefetching: boolean;
  isFetching: boolean;
  error: unknown;
  isEmpty: boolean;
  deleteAssignment: (assignmentId: number) => Promise<void>;
  editAssignment: (assignmentId: number) => void;
  refetch: () => Promise<void>;
}

// Simple query key for caching
const ASSIGNMENTS_QUERY_KEY = 'studentAssignments';

export function useStudentAssignments(
  user: EnhancedUser | null | undefined
): UseStudentAssignmentsResult {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Helper to convert API data to our frontend format
  function transformData(
    assignments: AssignmentRecord[],
    files: FileRecord[] | null
  ): StudentAssignment[] {
    // Create image map for faster lookups
    const imageMap = new Map<number, string>();
    
    if (files && files.length > 0) {
      files?.forEach(file => {
        if (
          file?.file_type?.startsWith("image") && 
          !imageMap.has(file.assignment_id) &&
          file.file_url
        ) {
          imageMap.set(file.assignment_id, file.file_url);
        }
      });
    }
    
    // Transform data
    return assignments.map((item) => ({
      id: item.id,
      title: item.title,
      subject: item.subject,
      grade: item.grade as GradeLevel,
      dueDate: item.due_date,
      status: item.status,
      imageUrl: imageMap.get(item.id) || "/broken-image.png",
    }));
  }
  
  // Check if response is an error
  function isError(result: unknown): boolean {
    return result && typeof result === 'object' && 'code' in result && 'message' in result;
  }

  // Main fetch function
  const fetchAssignments = useCallback(async () => {
    if (!user?.id) {
      return [];
    }

    try {
      // Get assignments 
      const assignmentsResult = await getAssignments(user.id);
      
      if (isError(assignmentsResult)) {
        console.error("Error fetching assignments:", assignmentsResult);
        throw {
          type: 'fetch',
          message: "Failed to load assignments",
          originalError: assignmentsResult
        };
      }
      
      const data = assignmentsResult as AssignmentRecord[];
      
      if (!data || data.length === 0) {
        return [];
      }

      // Get assignment files
      const assignmentIds = data.map(a => a.id);
      let filesData = null;

      try {
        const filesResult = await getFilesForMultipleAssignments(assignmentIds, user.id);
        
        if (!isError(filesResult)) {
          filesData = filesResult;
        } else {
          console.error("Error fetching files:", filesResult);
        }
      } catch (fileError) {
        console.error("Error getting files:", fileError);
        // Continue without files
      }

      // Transform data to our format
      return transformData(data, filesData);

    } catch (error) {
      if ((error as AssignmentError).type) {
        throw error;
      }
      
      throw {
        type: 'network',
        message: "Network error while fetching assignments",
        originalError: error
      };
    }
  }, [user]);

  // Fetch data with react-query
  const { 
    data: assignments = [], 
    isLoading,
    isFetching,
    isRefetching, 
    error, 
    refetch 
  } = useQuery({
    queryKey: [ASSIGNMENTS_QUERY_KEY, user?.id],
    queryFn: fetchAssignments,
    enabled: !!user?.id,
    retry: (failureCount, error: unknown) => {
      // Don't retry auth errors
      if (error && 
          typeof error === 'object' && 
          'type' in error && 
          (error as AssignmentError).type === 'auth') {
        return false;
      }
      return failureCount < 2; // Only retry twice
    },
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 5000),
  });

  // Delete assignment mutation
  const deleteAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: number) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      
      const result = await apiDeleteAssignment(assignmentId, user.id);
      
      if (isError(result)) {
        throw new Error("Failed to delete assignment");
      }
      
      return assignmentId;
    },
    onMutate: async (assignmentId) => {
      const toastId = toast.loading("Deleting assignment...");
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [ASSIGNMENTS_QUERY_KEY, user?.id]
      });

      // Optimistic update
      const previousData = queryClient.getQueryData([ASSIGNMENTS_QUERY_KEY, user?.id]);
      
      queryClient.setQueryData(
        [ASSIGNMENTS_QUERY_KEY, user?.id],
        (oldData: StudentAssignment[] | undefined) => {
          if (!oldData) return [];
          return oldData.filter(a => a.id !== assignmentId);
        }
      );
      
      return { toastId, previousData };
    },
    onSuccess: (_, __, context) => {
      if (context?.toastId) {
        toast.dismiss(context.toastId);
      }
      toast.success("Assignment deleted successfully");
      
      // Refetch to ensure data consistency
      queryClient.invalidateQueries({ 
        queryKey: [ASSIGNMENTS_QUERY_KEY, user?.id] 
      });
    },
    onError: (_, __, context) => {
      // Restore previous data
      if (context?.previousData) {
        queryClient.setQueryData(
          [ASSIGNMENTS_QUERY_KEY, user?.id], 
          context.previousData
        );
      }
      
      if (context?.toastId) {
        toast.dismiss(context.toastId);
      }
      toast.error("Failed to delete assignment");
    }
  });

  // Handler functions
  const deleteAssignment = async (assignmentId: number) => {
    if (!user?.id) {
      toast.error("You must be logged in to delete assignments");
      return;
    }
    
    try {
      await deleteAssignmentMutation.mutateAsync(assignmentId);
    } catch (err) {
      // Error already handled in mutation
      console.error("Delete error:", err);
    }
  };

  const editAssignment = (assignmentId: number) => {
    if (!user?.id) {
      toast.error("You must be logged in to edit assignments");
      return;
    }
    
    navigate(ROUTES.STUDENT.MANAGE_ASSIGNMENT.replace(':id?', String(assignmentId)));
  };

  // Return everything the component needs
  return {
    assignments,
    isLoading,
    isRefetching,
    isFetching,
    error,
    isEmpty: assignments.length === 0 && !isLoading,
    deleteAssignment,
    editAssignment,
    refetch: async () => { 
      try {
        await refetch(); 
      } catch (err) {
        console.error("Refetch error:", err);
        toast.error("Failed to refresh assignments");
      }
    }
  };
}