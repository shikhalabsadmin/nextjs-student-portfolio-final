import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { uploadAssignmentFile } from "@/lib/api/assignments";
import { validateFileType, validateFileSize } from "@/lib/utils/file-validation.utils";
import type { AssignmentFile } from "@/types/file";

type FileUploadOptions = {
  /**
   * Called before upload to get the current files
   */
  getFiles: () => AssignmentFile[];
  
  /**
   * Called to update files in the UI/state
   */
  setFiles: (files: AssignmentFile[], isTemporary?: boolean) => Promise<void>;
  
  /**
   * ID of the assignment to associate with the uploaded files
   */
  assignmentId?: string;
  
  /**
   * ID of the student uploading the files
   */
  studentId?: string;
  
  /**
   * Optional custom messages for toasts
   */
  successMessage?: string;
  invalidFilesMessage?: string;
  errorMessage?: string;
  
  /**
   * Optional custom validation functions
   */
  customValidation?: (file: File) => boolean;
};

type FileUploadHookReturn = {
  handleFiles: (fileList: FileList) => Promise<void>;
  uploadingFiles: AssignmentFile[];
};

/**
 * A reusable hook for file uploads with progress tracking
 */
export function useFileUpload(options: FileUploadOptions): FileUploadHookReturn {
  const { 
    getFiles, 
    setFiles, 
    assignmentId, 
    studentId,
    successMessage, 
    invalidFilesMessage, 
    errorMessage,
    customValidation 
  } = options;
  
  const { toast } = useToast();
  const [uploadingFiles, setUploadingFiles] = useState<AssignmentFile[]>([]);

  const handleFiles = useCallback(async (fileList: FileList) => {
    // Validate files first
    const filesArray = Array.from(fileList);
    
    // Debug entire file list
    console.log("Files to validate:", filesArray.map(f => ({ name: f.name, type: f.type, size: `${(f.size / (1024 * 1024)).toFixed(2)}MB` })));
    
    // Separate invalid files by type and size
    const invalidTypeFiles: File[] = [];
    const invalidSizeFiles: File[] = [];
    
    filesArray.forEach(file => {
      // Check for invalid file types
      const validType = validateFileType(file);
      if (!validType) {
        console.log(`File type validation failed: ${file.name} (${file.type})`);
        invalidTypeFiles.push(file);
        return; // Skip further validation for this file
      }
      
      // Check for invalid file sizes
      const validSize = validateFileSize(file);
      if (!validSize) {
        console.log(`File size validation failed: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
        invalidSizeFiles.push(file);
        return; // Skip further validation for this file
      }
      
      // Apply custom validation if provided
      if (customValidation && !customValidation(file)) {
        console.log(`Custom validation failed: ${file.name}`);
        invalidTypeFiles.push(file); // Add to type failures for simplicity
      }
    });
    
    // Count the actual invalid files
    const totalInvalidFiles = invalidTypeFiles.length + invalidSizeFiles.length;
    console.log(`Total invalid files: ${totalInvalidFiles}`);
    
    // Check for invalid files and show specific error messages
    if (totalInvalidFiles > 0) {
      const invalidTypeNames = invalidTypeFiles.map(f => f.name).join(', ');
      const invalidSizeNames = invalidSizeFiles.map(f => f.name).join(', ');
      
      let errorMessage = "";
      
      if (invalidTypeFiles.length > 0) {
        errorMessage += `Invalid file types: ${invalidTypeNames}. `;
      }
      
      if (invalidSizeFiles.length > 0) {
        errorMessage += `Files exceeding 250MB: ${invalidSizeNames}. `;
      }
      
      errorMessage += "Files must be images, videos, audio, or PDFs and under 250MB.";
      
      toast({
        title: "Invalid files",
        description: invalidFilesMessage || errorMessage,
        variant: "destructive",
      });
      
      console.error("Invalid files:", {
        invalidTypes: invalidTypeFiles.map(f => ({ name: f.name, type: f.type })),
        invalidSizes: invalidSizeFiles.map(f => ({ name: f.name, size: `${(f.size / (1024 * 1024)).toFixed(2)}MB` }))
      });
      
      return;
    }
    
    // Get valid files only (remove any that failed validation)
    const validFiles = filesArray.filter(file => 
      !invalidTypeFiles.includes(file) && !invalidSizeFiles.includes(file)
    );
    
    if (validFiles.length === 0) {
      console.log("No valid files to upload after validation");
      return;
    }
    
    console.log(`Proceeding with ${validFiles.length} valid files`);
    
    // Create temp files with object URLs for immediate display
    const currentFiles = getFiles();
    const tempFiles = validFiles.map(file => ({
      id: null,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      file_url: URL.createObjectURL(file),
      assignment_id: assignmentId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_process_documentation: false,
      uploadProgress: 0
    }) as AssignmentFile);

    // Update UI immediately (optimistic)
    const newFiles = [...currentFiles, ...tempFiles];
    await setFiles(newFiles, true);
    
    // Track uploading files for additional UI feedback if needed
    setUploadingFiles(prev => [...prev, ...tempFiles]);
    
    try {
      const uploadPromises = validFiles.map((file, index) => {
        const tempFileIndex = currentFiles.length + index;
        
        // Progress tracking function - improved for reliability
        const updateProgress = (progress: number) => {
          // Force progress to be a valid number between 0-100
          const safeProgress = Math.max(0, Math.min(100, Math.round(progress || 0)));
          
          // Log progress updates to help with debugging
          console.log(`[DEBUG PROGRESS BAR] Progress update for ${file.name}: ${safeProgress}% (original value: ${progress})`);
          
          // Get fresh current state to avoid state conflicts
          const currentState = getFiles();
          
          // Verify the file index is still valid
          if (currentState[tempFileIndex]) {
            const updatedFiles = [...currentState];
            
            // Check if progress value has actually changed
            const currentProgress = updatedFiles[tempFileIndex].uploadProgress || 0;
            if (currentProgress !== safeProgress) {
              console.log(`[DEBUG PROGRESS BAR] Updating file ${file.name} progress from ${currentProgress}% to ${safeProgress}%`);
              
              // Create an updated file object with the new progress
              updatedFiles[tempFileIndex] = {
                ...updatedFiles[tempFileIndex],
                uploadProgress: safeProgress
              } as AssignmentFile;
              
              // Don't await this to avoid blocking progress updates
              setFiles(updatedFiles, true).catch(err => {
                console.error(`[DEBUG PROGRESS BAR] Error updating progress for ${file.name}:`, err);
              });
            }
          } else {
            console.warn(`[DEBUG PROGRESS BAR] File index not found for progress update: ${tempFileIndex}, file: ${file.name}`);
          }
        };
        
        // Force initial progress update to ensure UI shows something
        updateProgress(0);
        
        return uploadAssignmentFile(file, assignmentId, studentId, { 
          is_process_documentation: false,
          onProgress: updateProgress
        });
      });
      
      const uploadedFiles = await Promise.all(uploadPromises);
      
      // Replace temp file entries with server responses
      const finalFiles = [...currentFiles];
      uploadedFiles.forEach((uploadedFile, index) => {
        if (uploadedFile) {
          finalFiles.push(uploadedFile);
        }
      });
      
      // Clean up object URLs to prevent memory leaks
      tempFiles.forEach(file => {
        if (typeof file.file_url === 'string' && file.file_url.startsWith('blob:')) {
          URL.revokeObjectURL(file.file_url);
        }
      });
      
      await setFiles(finalFiles);
      
      // Update uploading files state
      setUploadingFiles(prev => prev.filter(file => 
        !tempFiles.some(tempFile => tempFile.file_url === file.file_url)
      ));
      
      toast({
        title: "Success",
        description: successMessage || "Files uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading files:", error);
      
      // Clean up object URLs on error too
      tempFiles.forEach(file => {
        if (typeof file.file_url === 'string' && file.file_url.startsWith('blob:')) {
          URL.revokeObjectURL(file.file_url);
        }
      });
      
      // Revert to previous state
      await setFiles(currentFiles);
      
      // Update uploading files state
      setUploadingFiles(prev => prev.filter(file => 
        !tempFiles.some(tempFile => tempFile.file_url === file.file_url)
      ));
      
      toast({
        title: "Upload failed",
        description: errorMessage || "There was an error uploading your files. Please try again.",
        variant: "destructive",
      });
    }
  }, [
    getFiles, 
    setFiles, 
    assignmentId, 
    studentId, 
    customValidation, 
    toast, 
    successMessage, 
    invalidFilesMessage, 
    errorMessage
  ]);

  return { handleFiles, uploadingFiles };
} 