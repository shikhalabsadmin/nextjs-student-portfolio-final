import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { ASSIGNMENT_KEYS } from "@/query-key/student-assignment";
import { ASSIGNMENT_STATUS, AssignmentStatus } from "@/constants/assignment-status";
import { Subject, GradeLevel } from "@/constants/grade-subjects";
import { getAssignmentFiles } from "./assignment-files";
import { Assignment } from "@/types/assignment";

// Create a module-specific logger
const apiLogger = logger.forModule("assignment-api");

export const createAssignment = async (assignmentData: Record<string, unknown>) => {
  try {
    console.log("[API] Creating new assignment with data:", assignmentData);
    
    if (!assignmentData.student_id) {
      console.error("[API] Missing student_id in assignment data");
      return { error: { message: "Missing student_id in assignment data" } };
    }
    
    const { data, error } = await supabase
      .from("assignments")
      .insert(assignmentData)
      .select("*")
      .single();

    if (error) {
      console.error("[API] Error creating assignment:", error);
      apiLogger.error("Failed to create assignment", { error });
      return { error };
    }

    console.log("[API] Assignment created successfully:", data);
    apiLogger.info("Assignment created successfully", { id: data.id });
    return data;
  } catch (error: unknown) {
    console.error("[API] Unexpected error creating assignment:", error);
    apiLogger.error("Unexpected error creating assignment", { error });
    return { error: { message: "Unexpected error creating assignment" } };
  }
};

export const getAssignments = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("student_id", userId)
      .order('updated_at', { ascending: false });

    if (error) {
      return error;
    }

    return data;
  } catch (error: unknown) {
    console.error("Error fetching assignments:", error);
    return error;
  }
};

export const getAssignment = async (id: string) => {
  try {
    console.log("[API] getAssignment called with ID:", id);
    
    if (!id) {
      console.error("[API] getAssignment: No ID provided");
      return null;
    }
    
    if (id === ":id" || id === "new") {
      console.error("[API] getAssignment: Invalid ID format - placeholder detected:", id);
      return null;
    }

    apiLogger.debug("Fetching assignment", { id });
    
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("id", id)
      .single();
      
    console.log("[API] getAssignment response:", { data, error });

    if (error) {
      console.error("[API] Assignment fetch error:", error);
      apiLogger.error("Failed to fetch assignment", { id, error });
      return null;
    }

    if (!data) {
      console.warn("[API] No assignment found with ID:", id);
      apiLogger.warn("Assignment not found", { id });
      return null;
    }

    apiLogger.debug("Assignment fetched successfully", { id: data.id });
    console.log("[API] Assignment fetched successfully:", data.id);
    return data;
  } catch (error) {
    console.error("[API] Unexpected error in getAssignment:", error);
    apiLogger.error("Unexpected error in getAssignment", { id, error });
    return null;
  }
};

export const getAssignmentWithFiles = async (id?: string, userId?: string) => {
  try {
    console.log("[API] getAssignmentWithFiles called with ID:", id, "and userId:", userId);
    
    if (!id || id === ":id" || id === "new") {
      console.error("[API] getAssignmentWithFiles: Invalid assignment ID:", id);
      return null;
    }

    if (!userId) {
      console.error("[API] getAssignmentWithFiles: No user ID provided");
      return null;
    }

    apiLogger.debug("Fetching assignment with files", { id, userId });

    // Fetch the assignment
    const assignment = await getAssignment(id);
    console.log("[API] Assignment data:", assignment);

    if (!assignment) {
      console.error("[API] Assignment not found with ID:", id);
      return null;
    }

    // Check if the assignment belongs to this user
    if (assignment.student_id && assignment.student_id !== userId) {
      console.error("[API] Assignment belongs to different user");
      apiLogger.warn("Assignment belongs to different user", {
        assignmentId: id,
        assignmentOwnerId: assignment.student_id,
        requesterId: userId,
      });
      return null;
    }

    // Fetch the files for this assignment
    const files = await getAssignmentFiles(id, userId);
    console.log("[API] Assignment files:", files);

    // Combine the data
    return {
      ...assignment,
      files,
    };
  } catch (error) {
    console.error("[API] Error in getAssignmentWithFiles:", error);
    apiLogger.error("Error fetching assignment with files", { id, userId, error });
    return null;
  }
};


export const getAssignmentsByGrade = async (userId: string, grade: GradeLevel) => {
  try {
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("student_id", userId)
      .eq("grade", grade)
      .order('updated_at', { ascending: false });

    if (error) {
      return error;
    }

    return data;
  } catch (error: unknown) {
    console.error(`Error fetching assignments for grade ${grade}:`, error);
    return error;
  }
};

export const getAssignmentsBySubject = async (userId: string, subject: Subject) => {
  try {
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("student_id", userId)
      .eq("subject", subject)
      .order('updated_at', { ascending: false });

    if (error) {
      return error;
    }

    return data;
  } catch (error: unknown) {
    console.error(`Error fetching assignments for subject ${subject}:`, error);
    return error;
  }
};

export const getAssignmentsByStatus = async (userId: string, status: AssignmentStatus) => {
  try {
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("student_id", userId)
      .eq("status", status)
      .order('updated_at', { ascending: false });

    if (error) {
      return error;
    }

    return data;
  } catch (error: unknown) {
    console.error(`Error fetching assignments with status ${status}:`, error);
    return error;
  }
};

export const getApprovedAssignments = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("student_id", userId)
      .eq("status", ASSIGNMENT_STATUS.APPROVED)
      .order('updated_at', { ascending: false });

    if (error) {
      return error;
    }

    return data;
  } catch (error: unknown) {
    console.error("Error fetching approved assignments:", error);
    return error;
  }
};

export const updateAssignment = async (
  assignmentId: string, 
  userId: string, 
  updateData: Record<string, unknown>
) => {
  try {
    const { data, error } = await supabase
      .from("assignments")
      .update(updateData)
      .eq("id", assignmentId)
      .eq("student_id", userId)
      .select("*")
      .single();

    if (error) {
      return error;
    }

    return data;
  } catch (error: unknown) {
    console.error(`Error updating assignment ${assignmentId}:`, error);
    return error;
  }
};

export const deleteAssignment = async (assignmentId: string, userId: string) => {
  try {
    // Try to use the RPC function first
    const { error: rpcError } = await supabase.rpc('delete_assignment_with_files', {
      p_assignment_id: assignmentId,
      p_student_id: userId
    });
    
    if (rpcError) {
      console.warn("RPC function failed, falling back to direct delete:", rpcError);
      
      // Direct delete as fallback
      const { error } = await supabase
        .from("assignments")
        .delete()
        .eq("id", assignmentId)
        .eq("student_id", userId);

      if (error) {
        return error;
      }
    }
    
    return { success: true, id: assignmentId };
  } catch (error: unknown) {
    console.error(`Error deleting assignment ${assignmentId}:`, error);
    return error;
  }
};




