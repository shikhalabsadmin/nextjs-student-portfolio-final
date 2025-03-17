import { supabase } from "@/integrations/supabase/client";
import { debugStorage } from "@/lib/utils/debug.service";

/**
 * Service for storage operations
 */
export class StorageService {
  /**
   * Upload a file to Supabase storage
   */
  static async uploadFile(file: File, bucketName = "assignments"): Promise<string> {
    // Generate unique filename
    const fileExt = file.name.split(".").pop() || '';
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    
    debugStorage.step('Uploading to storage', { 
      fileName, 
      fileSize: file.size, 
      fileType: file.type,
      bucket: bucketName 
    });

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file);

    if (uploadError) {
      debugStorage.error('Storage upload failed', uploadError);
      throw uploadError;
    }
    
    debugStorage.info('File uploaded successfully', { fileName });
    return fileName;
  }

  /**
   * Get a public URL for a file in storage
   */
  static getPublicFileUrl(filePath: string, bucketName = "assignments"): string {
    debugStorage.step('Generating public URL', { filePath, bucket: bucketName });
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    debugStorage.info('Public URL generated', { publicUrl });
    return publicUrl;
  }

  /**
   * Delete a file from storage
   */
  static async deleteFile(filePath: string, bucketName = "assignments"): Promise<void> {
    debugStorage.step('Deleting from storage', { filePath, bucket: bucketName });
    
    const { error: storageError } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (storageError) {
      debugStorage.error('Storage deletion failed', storageError);
      throw storageError;
    }
    
    debugStorage.info('File deleted from storage');
  }

  /**
   * List files in a storage bucket/folder
   */
  static async listFiles(path = "", bucketName = "assignments"): Promise<string[]> {
    debugStorage.step('Listing files in storage', { path, bucket: bucketName });
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(path);
      
    if (error) {
      debugStorage.error('Storage list files failed', error);
      throw error;
    }
    
    const fileNames = data.map(item => item.name);
    debugStorage.info('Files list retrieved', { fileCount: fileNames.length });
    
    return fileNames;
  }

  /**
   * Check if a file exists in storage
   */
  static async fileExists(filePath: string, bucketName = "assignments"): Promise<boolean> {
    try {
      debugStorage.step('Checking if file exists', { filePath, bucket: bucketName });
      
      // Attempt to get file metadata as a way to check existence
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list(filePath.split('/').slice(0, -1).join('/'), {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' },
        });
        
      if (error) {
        debugStorage.error('Storage file check failed', error);
        return false;
      }
      
      const fileName = filePath.split('/').pop() || '';
      const exists = data.some(item => item.name === fileName);
      
      debugStorage.info('File existence check result', { exists });
      return exists;
    } catch (error) {
      debugStorage.error('File existence check error', error);
      return false;
    }
  }
} 