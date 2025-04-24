import { supabase } from "@/integrations/supabase/client";
import { StudentAssignment } from "@/types/student-dashboard";
import { AssignmentStatus } from "@/constants/assignment-status";
import { Subject, GradeLevel } from "@/constants/grade-subjects";



export const createAssignment = async (assignmentData: Record<string, unknown>) => {
  try {
    const { data, error } = await supabase
      .from("assignments")
      .insert(assignmentData)
      .select("*")
      .single();

    if (error) {
      return error;
    }

    return data;
  } catch (error: unknown) {
    console.error("Error creating assignment:", error);
    return error;
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

export const getAssignmentById = async (assignmentId: number, userId: string) => {
  try {
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("id", assignmentId)
      .eq("student_id", userId)
      .single();

    if (error) {
      return error;
    }

    return data;
  } catch (error: unknown) {
    console.error(`Error fetching assignment ${assignmentId}:`, error);
    return error;
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

export const updateAssignment = async (
  assignmentId: number, 
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

export const deleteAssignment = async (assignmentId: number, userId: string) => {
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




