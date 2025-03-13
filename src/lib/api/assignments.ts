import { supabase } from "@/integrations/supabase/client";
import type { AssignmentFormValues } from "@/lib/validations/assignment";
import type { 
  AssignmentFile,
  FileUploadResponse,
  FileRecordData,
  AssignmentFileInput,
  StorageFile
} from "@/types/file";
import { getFileTypeCategory } from "@/lib/utils/file-type.utils";
import { debugAPI } from "@/lib/utils/debug.service";

// File handling functions
async function uploadFileToStorage(file: File, filePath: string): Promise<FileUploadResponse> {
  debugAPI.step('Uploading to storage', { filePath });
  const { error: uploadError } = await supabase.storage
    .from("assignments")
    .upload(filePath, file);

  if (uploadError) {
    debugAPI.error('Storage upload failed', uploadError);
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from("assignments")
    .getPublicUrl(filePath);

  return { publicUrl };
}

async function createFileRecord(fileData: FileRecordData): Promise<AssignmentFile> {
  debugAPI.step('Creating database record');
  const { data, error: fileError } = await supabase
    .from("assignment_files")
    .insert({
      ...fileData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (fileError) {
    debugAPI.error('Database insert failed', fileError);
    throw fileError;
  }

  return data;
}

export async function uploadAssignmentFile(file: File, assignment_id?: string): Promise<AssignmentFile> {
  debugAPI.step('Starting single file upload', { fileName: file.name, assignment_id });
  
  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = fileName;

  const { publicUrl } = await uploadFileToStorage(file, filePath);
  debugAPI.info('File uploaded successfully');

  const fileData = await createFileRecord({
    assignment_id,
    file_url: publicUrl,
    file_name: file.name,
    file_type: getFileTypeCategory(file.type),
    file_size: file.size
  });

  debugAPI.info('File record created successfully', fileData);
  return fileData;
}

// Assignment handling functions
async function createAssignmentRecord(data: Omit<AssignmentFormValues, 'files'>) {
  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .insert({
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (assignmentError) throw assignmentError;
  return assignment;
}

async function handleAssignmentFiles(files: AssignmentFileInput[], assignmentId: string): Promise<void> {
  const newFiles = files.filter((file): file is File => file instanceof File);
  if (newFiles.length > 0) {
    const filePromises = newFiles.map(file => uploadAssignmentFile(file, assignmentId));
    await Promise.all(filePromises);
  }
}

export async function createAssignment(data: AssignmentFormValues) {
  const { files = [], ...assignmentData } = data;
  
  const assignment = await createAssignmentRecord(assignmentData);

  if (Array.isArray(files) && files.length > 0) {
    await handleAssignmentFiles(files as AssignmentFileInput[], assignment.id);
  }

  return assignment;
}

async function updateAssignmentRecord(id: string, data: Omit<AssignmentFormValues, 'files'>) {
  const { error: assignmentError } = await supabase
    .from("assignments")
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (assignmentError) throw assignmentError;
}

async function deleteExistingFiles(assignmentId: string): Promise<void> {
  await supabase
    .from("assignment_files")
    .delete()
    .eq("assignment_id", assignmentId);
}

async function fetchUpdatedAssignment(id: string) {
  const { data: updatedAssignment, error: fetchError } = await supabase
    .from("assignments")
    .select(`
      *,
      files:assignment_files(*)
    `)
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;
  return updatedAssignment;
}

export async function updateAssignment(id: string, data: AssignmentFormValues) {
  const { files = [], ...assignmentData } = data;

  await updateAssignmentRecord(id, assignmentData);

  if (Array.isArray(files) && files.length > 0) {
    await deleteExistingFiles(id);
    await handleAssignmentFiles(files as AssignmentFileInput[], id);
  }

  return fetchUpdatedAssignment(id);
}

export async function getAssignment(id: string) {
  const { data, error } = await supabase
    .from("assignments")
    .select(`
      *,
      files:assignment_files(*)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

async function deleteStorageFiles(files: StorageFile[]): Promise<void> {
  for (const file of files) {
    const filePath = file.file_url.split("/").pop();
    if (filePath) {
      await supabase.storage
        .from("assignments")
        .remove([filePath]);
    }
  }
}

async function fetchAssignmentFiles(id: string) {
  return supabase
    .from("assignment_files")
    .select("file_url")
    .eq("assignment_id", id);
}

export async function deleteAssignment(id: string): Promise<void> {
  const { data: files } = await fetchAssignmentFiles(id);

  if (files?.length) {
    await deleteStorageFiles(files);
  }

  const { error } = await supabase
    .from("assignments")
    .delete()
    .eq("id", id);

  if (error) throw error;
} 