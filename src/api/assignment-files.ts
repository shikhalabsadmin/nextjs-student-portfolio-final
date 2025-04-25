import { supabase } from "@/integrations/supabase/client";



export const uploadAssignmentFile = async (
  file: File,
  assignmentId: string,
  userId: string
) => {
  try {
    // Generate a unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${assignmentId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('assignments')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      return uploadError;
    }

    // Get the public URL for the file
    const { data: urlData } = supabase.storage.from('assignments').getPublicUrl(fileName);
    const fileUrl = urlData.publicUrl;
    
    // Add file record to database
    const fileRecord = {
      assignment_id: assignmentId,
      student_id: userId,
      file_url: fileUrl,
      file_type: file.type,
      file_name: file.name,
      file_size: file.size
    };
    
    const { error: dbError } = await supabase
      .from('assignment_files')
      .insert(fileRecord);
      
    if (dbError) {
      // If database insert fails, try to delete the uploaded file
      await supabase.storage.from('assignments').remove([fileName]);
      return dbError;
    }
    
    return {
      path: fileName,
      fileUrl
    };
  } catch (error: unknown) {
    console.error("Error uploading assignment file:", error);
    return error;
  }
};

export const uploadMultipleFiles = async (
  files: File[], 
  assignmentId: string, 
  userId: string
) => {
  const uploadResults = [];
  
  for (const file of files) {
    try {
      const result = await uploadAssignmentFile(file, assignmentId, userId);
      uploadResults.push(result);
    } catch (error: unknown) {
      console.error(`Error uploading file ${file.name}:`, error);
      // Continue with other files even if one fails
    }
  }
  
  return uploadResults;
};

export const getAssignmentFiles = async (assignmentId: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from("assignment_files")
        .select("*")
        .eq("assignment_id", assignmentId)
        .eq("student_id", userId)
        .order('updated_at', { ascending: false });
  
      if (error) {
        return error;
      }
  
      return data;
    } catch (error: unknown) {
      console.error("Error fetching assignment files:", error);
      return error;
    }
  };
  
  export const getAssignmentImageFiles = async (assignmentId: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from("assignment_files")
        .select("*")
        .eq("assignment_id", assignmentId)
        .eq("student_id", userId)
        .like("file_type", "image/%")
        .order('updated_at', { ascending: false });
  
      if (error) {
        return error;
      }
  
      return data;
    } catch (error: unknown) {
      console.error("Error fetching assignment image files:", error);
      return error;
    }
  };
  
  export const getFilesForMultipleAssignments = async (assignmentIds: string[], userId: string) => {
    try {
      const { data, error } = await supabase
        .from("assignment_files")
        .select("*")
        .eq("student_id", userId)
        .in("assignment_id", assignmentIds)
        .order('updated_at', { ascending: false });
  
      if (error) {
        return error;
      }
  
      return data;
    } catch (error: unknown) {
      console.error("Error fetching files for multiple assignments:", error);
      return error;
    }
  };

export const deleteAssignmentFile = async (fileUrl: string, userId: string) => {
  try {
    // Extract filename from URL
    const path = fileUrl.split('/').pop();
    if (!path) {
      return new Error("Invalid file URL");
    }
    
    // Delete from database first
    const { error: dbError } = await supabase
      .from('assignment_files')
      .delete()
      .eq('file_url', fileUrl)
      .eq('student_id', userId);
      
    if (dbError) {
      return dbError;
    }
    
    // Then delete from storage
    const { error: storageError } = await supabase.storage
      .from('assignments')
      .remove([path]);
      
    if (storageError) {
      console.warn("File deleted from database but not from storage:", storageError);
    }
    
    return { success: true, path };
  } catch (error: unknown) {
    console.error("Error deleting assignment file:", error);
    return error;
  }
};

export const deleteAllAssignmentFiles = async (assignmentId: string, userId: string) => {
  try {
    // First get all files for this assignment
    const result = await getAssignmentFiles(assignmentId, userId);
    
    // If result is an error or empty array
    if (!result || typeof result === 'object' && 'code' in result) {
      return result || { success: true, count: 0 };
    }
    
    // If we get here, result should be an array of files
    const files = result as { file_url: string }[];
    if (files.length === 0) {
      return { success: true, count: 0 };
    }
    
    // Extract file paths from URLs
    const filePaths = files
      .map(file => file.file_url.split('/').pop())
      .filter(Boolean);
    
    // Delete from storage
    if (filePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('assignments')
        .remove(filePaths);
        
      if (storageError) {
        console.warn("Error deleting files from storage:", storageError);
      }
    }
    
    // Delete from database
    const { error: dbError } = await supabase
      .from('assignment_files')
      .delete()
      .eq('assignment_id', assignmentId)
      .eq('student_id', userId);
      
    if (dbError) {
      return dbError;
    }
    
    return { success: true, count: files.length };
  } catch (error: unknown) {
    console.error(`Error deleting all files for assignment ${assignmentId}:`, error);
    return error;
  }
};
