import { supabase } from "@/integrations/supabase/client";
import type { AssignmentFormValues } from "@/lib/validations/assignment";
import type { FileRecordData } from "@/types/file";
import { getFileTypeCategory } from "@/lib/utils/file-type.utils";
import { createDebugService } from "@/lib/utils/debug.service";

const debug = createDebugService("Assignments API");

// Assignment CRUD operations
export const createAssignment = async (data: AssignmentFormValues) => {
  debug.log("Creating assignment", data);
  const { data: createdData, error } = await supabase
    .from("assignments")
    .insert(data)
    .select()
    .single();

  if (error) {
    debug.error("Failed to create assignment", error);
    throw error;
  }

  return createdData;
};

export const getAssignment = async (id: string) => {
  try {
    if (!id || typeof id !== 'string' || id === ':id') {
      debug.error("Invalid assignment ID provided", { id });
      throw new Error("Invalid assignment ID");
    }

    debug.log("Fetching assignment", { id });
    
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      debug.error("Failed to fetch assignment", { id, error });
      throw error;
    }

    if (!data) {
      debug.warn("Assignment not found", { id });
      throw new Error(`Assignment with ID ${id} not found`);
    }

    debug.log("Assignment fetched successfully", { 
      id, 
      title: data.title, 
      status: data.status 
    });
    
    return data;
  } catch (error) {
    debug.error("Error in getAssignment", { id, error });
    throw error;
  }
};

export const updateAssignment = async (
  id: string,
  data: Partial<AssignmentFormValues>
) => {
  debug.log("Updating assignment", { id, data });
  const { data: updatedData, error } = await supabase
    .from("assignments")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    debug.error("Failed to update assignment", error);
    throw error;
  }

  return updatedData;
};

export const deleteAssignment = async (id: string) => {
  debug.log("Deleting assignment", { id });

  // First delete all associated files
  const files = await fetchAssignmentFiles(id);
  if (files && files?.length > 0) {
    await deleteAssignmentFiles(
      id,
      files?.map((file) => file?.id)
    );
  }

  // Then delete the assignment
  const { error } = await supabase.from("assignments").delete().eq("id", id);

  if (error) {
    debug.error("Failed to delete assignment", error);
    throw error;
  }

  return { success: true };
};

export const getAssignmentWithFiles = async (id?: string, userId?: string) => {
  try {
    // Validate input parameters
    if (!id || id === ":id") {
      debug.error("Invalid assignment ID", { id });
      throw new Error("Invalid assignment ID");
    }

    if (!userId) {
      debug.error("Missing user ID for assignment fetch", { id });
      throw new Error("User ID is required");
    }

    debug.log("Fetching assignment with files", { id, userId });

    // Fetch the assignment
    const assignment = await getAssignment(id);

    // If assignment doesn't exist or doesn't belong to this user
    if (!assignment || (assignment.student_id && assignment.student_id !== userId)) {
      debug.error("Assignment not found or access denied", { 
        id, userId, 
        exists: !!assignment,
        belongsToUser: assignment?.student_id === userId
      });
      throw new Error("Assignment not found or access denied");
    }

    // Fetch the files
    const files = await fetchAssignmentFiles(id);

    debug.log("getAssignmentWithFiles success", {
      id,
      title: assignment?.title,
      filesCount: files?.length || 0
    });

    // Return the assignment with files
    return { ...(assignment ?? {}), files: files ?? [] };
  } catch (error) {
    debug.error("Failed to fetch assignment with files", { id, error });
    throw error;
  }
};

// File operations
export const uploadFileToStorage = async (file: File, filePath: string, onProgress?: (progress: number) => void) => {
  debug.log("[DEBUG PROGRESS BAR] Starting file upload", { filePath, fileName: file.name, fileSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB` });

  // Initialize progress with 0 explicitly
  if (onProgress) {
    debug.log("[DEBUG PROGRESS BAR] Initializing progress at 0%");
    onProgress(0);
  }
  
  let progressFallbackTimer: NodeJS.Timeout | null = null;
  
  // Set up a fallback progress updater in case Supabase doesn't fire events
  if (onProgress) {
    let fallbackProgress = 1;
    progressFallbackTimer = setInterval(() => {
      // Only update if we're still under 90%
      if (fallbackProgress < 90) {
        fallbackProgress += 5;
        debug.log(`[DEBUG PROGRESS BAR] Fallback progress for ${file.name}: ${fallbackProgress}% (artificial)`);
        onProgress(fallbackProgress);
      }
    }, 500);
  }
  
  try {
    // Upload with progress tracking
    const { error: uploadError } = await supabase.storage
      .from("assignments")
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        onUploadProgress: (progressEvent: { loaded: number; total: number }) => {
          // Make sure we have a valid progress event
          if (!progressEvent || typeof progressEvent.loaded !== 'number' || typeof progressEvent.total !== 'number') {
            debug.log("[DEBUG PROGRESS BAR] Invalid progress event received", progressEvent);
            return;
          }
          
          // Calculate percentage (0-100)
          const percentage = progressEvent.total > 0 
            ? Math.min(Math.floor((progressEvent.loaded * 100) / progressEvent.total), 99) 
            : 0;
          
          // Log every progress update for debugging
          debug.log(`[DEBUG PROGRESS BAR] Upload progress for ${file.name}: ${percentage}% (${(progressEvent.loaded / (1024 * 1024)).toFixed(2)}MB / ${(progressEvent.total / (1024 * 1024)).toFixed(2)}MB)`);
          
          // Report progress to the caller
          if (onProgress) onProgress(percentage);
        }
      } as { cacheControl: string; upsert: boolean; onUploadProgress: (progressEvent: { loaded: number; total: number }) => void });

    // Clear the fallback timer
    if (progressFallbackTimer) {
      clearInterval(progressFallbackTimer);
      progressFallbackTimer = null;
    }

    if (uploadError) {
      debug.error("[DEBUG PROGRESS BAR] Failed to upload file", uploadError);
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("assignments").getPublicUrl(filePath);

    // Mark as complete with 100%
    if (onProgress) {
      debug.log(`[DEBUG PROGRESS BAR] Marking upload as complete (100%) for ${file.name}`);
      onProgress(100);
    }
    debug.log(`[DEBUG PROGRESS BAR] Upload completed for ${file.name}: ${publicUrl}`);

    return { publicUrl };
  } catch (error) {
    // Clear the fallback timer in case of error
    if (progressFallbackTimer) {
      clearInterval(progressFallbackTimer);
    }
    
    debug.error(`[DEBUG PROGRESS BAR] Error during upload of ${file.name}:`, error);
    throw error;
  }
};

export const createFileRecord = async (fileData: FileRecordData) => {
  debug.log("Creating file record", fileData);
  const { data, error } = await supabase
    .from("assignment_files")
    .insert(fileData)
    .select()
    .single();

  if (error) {
    debug.error("Failed to create file record", error);
    throw error;
  }

  return data;
};

export const uploadAssignmentFile = async (
  file: File,
  assignment_id?: string,
  student_id?: string,
  metadata?: { 
    is_process_documentation?: boolean,
    onProgress?: (progress: number) => void
  }
) => {
  debug.log("Uploading assignment file", {
    fileName: file.name,
    assignment_id,
    metadata
  });

  // Generate unique filename
  const fileExt = file.name.split(".").pop() || "";
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = fileName;

  // Upload file to storage with progress tracking
  const { publicUrl } = await uploadFileToStorage(file, filePath, metadata?.onProgress);

  // Create database record
  const fileData = await createFileRecord({
    assignment_id,
    file_url: publicUrl,
    file_name: file.name,
    file_type: getFileTypeCategory(file.type),
    file_size: file.size,
    student_id,
    ...(metadata ? { is_process_documentation: metadata.is_process_documentation } : {}) // Only spread the is_process_documentation field
  });

  return fileData;
};

export const fetchAssignmentFiles = async (id: string) => {
  debug.log("Fetching assignment files", { id });
  const { data, error } = await supabase
    .from("assignment_files")
    .select("*")
    .eq("assignment_id", id);

  if (error) {
    debug.error("Failed to fetch assignment files", error);
    throw error;
  }

  return data;
};

export const getFileById = async (id: string) => {
  debug.log("Fetching file by ID", { id });
  const { data, error } = await supabase
    .from("assignment_files")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    debug.error("Failed to fetch file", error);
    throw error;
  }

  return data;
};

export const deleteFileFromStorage = async (filePath: string) => {
  debug.log("Deleting file from storage", { filePath });
  const { error } = await supabase.storage
    .from("assignments") // Fixed the bucket name from "assignment" to "assignments"
    .remove([filePath]);

  if (error) {
    debug.error("Failed to delete file from storage", error);
    throw error;
  }

  return { success: true };
};

export const deleteFileRecord = async (id: string) => {
  debug.log("Deleting file record", { id });
  const { error } = await supabase
    .from("assignment_files")
    .delete()
    .eq("id", id);

  if (error) {
    debug.error("Failed to delete file record", error);
    throw error;
  }

  return { success: true };
};

export const deleteFile = async (id: string) => {
  debug.log("Deleting file completely", { id });

  // Get the file first to get the URL
  const file = await getFileById(id);
  if (!file) {
    throw new Error(`File with ID ${id} not found`);
  }

  // Extract the filename from the URL
  const filePath = file.file_url.split("/").pop();
  if (filePath) {
    await deleteFileFromStorage(filePath);
  }

  // Delete the database record
  await deleteFileRecord(id);

  return { success: true };
};

export const deleteAssignmentFiles = async (
  assignmentId: string,
  fileIds: string[]
) => {
  debug.log("Deleting assignment files", {
    assignmentId,
    fileCount: fileIds.length,
  });

  for (const fileId of fileIds) {
    try {
      await deleteFile(fileId);
    } catch (error) {
      debug.error(`Failed to delete file ${fileId}`, error);
      // Continue with other files even if one fails
    }
  }

  return { success: true };
};
