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
  debug.log("Fetching assignment", { id });
  const { data, error } = await supabase
    .from("assignments")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    debug.error("Failed to fetch assignment", error);
    throw error;
  }

  return data;
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

export const getAssignmentWithFiles = async (id: string) => {
  debug.log("Fetching assignment with files", { id });

  // Fetch the assignment

  const assignment = await getAssignment(id);

  // Fetch the files
  const files = await fetchAssignmentFiles(id);

  console.log("getAssignmentWithFiles", {
    ...(assignment ?? {}),
    files: files ?? [],
  });

  // Return the assignment with files
  return { ...(assignment ?? {}), files: files ?? [] };
};

// File operations
export const uploadFileToStorage = async (file: File, filePath: string) => {
  debug.log("Uploading file to storage", { filePath });

  const { error: uploadError } = await supabase.storage
    .from("assignments")
    .upload(filePath, file);

  if (uploadError) {
    debug.error("Failed to upload file", uploadError);
    throw uploadError;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("assignments").getPublicUrl(filePath);

  return { publicUrl };
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
  metadata?: { is_process_documentation?: boolean }
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

  // Upload file to storage
  const { publicUrl } = await uploadFileToStorage(file, filePath);

  // Create database record
  const fileData = await createFileRecord({
    assignment_id,
    file_url: publicUrl,
    file_name: file.name,
    file_type: getFileTypeCategory(file.type),
    file_size: file.size,
    student_id,
    ...metadata // Spread any additional metadata fields
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
