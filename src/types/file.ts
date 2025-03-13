// Base file type with common properties
export interface BaseFileData {
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
}

// Response from file upload operations
export type FileUploadResponse = {
  publicUrl: string;
  error?: Error;
};

// File data with optional assignment relationship
export type FileRecordData = BaseFileData & {
  assignment_id?: string;
};

// Simple file reference (used in StorageFile)
export type StorageFile = {
  file_url: string;
};

// Complete assignment file entity with all metadata
export interface AssignmentFile extends BaseFileData {
  id?: string;
  assignment_id?: string;
  created_at?: string;
  updated_at?: string;
  student_id?: string;
}

// Union type for file inputs
export type AssignmentFileInput = File | AssignmentFile; 