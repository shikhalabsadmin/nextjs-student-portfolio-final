import { useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { deleteFile } from "@/lib/api/assignments";
import type { AssignmentFile } from "@/types/file";

type FileDeleteOptions = {
  /**
   * Called before deletion to get the current files
   */
  getFiles: () => AssignmentFile[];
  
  /**
   * Called to update files in the UI/state
   */
  setFiles: (files: AssignmentFile[]) => Promise<void>;
  
  /**
   * Optional custom toasts for success/error states
   */
  successMessage?: string;
  errorMessage?: string;
};

type FileManagementHookReturn = {
  handleDeleteFile: (file: AssignmentFile, index: number) => Promise<void>;
};

/**
 * A reusable hook for file management operations like deletion
 */
export function useFileManagement(options: FileDeleteOptions): FileManagementHookReturn {
  const { toast } = useToast();
  const { getFiles, setFiles, successMessage, errorMessage } = options;

  const handleDeleteFile = useCallback(async (file: AssignmentFile, index: number) => {
    // Only attempt API delete if file has an ID
    const hasFileId = Boolean(file.id);
    
    // Store current state for potential rollback
    const currentFiles = getFiles();
    const fileToDelete = {...currentFiles[index]};
    
    // Update UI immediately
    const newFiles = [...currentFiles];
    newFiles.splice(index, 1);
    
    await setFiles(newFiles);
    
    // If no file ID, no need for server operation
    if (!hasFileId) return;
    
    try {
      await deleteFile(file.id!);
      toast({
        title: "Success",
        description: successMessage || "File deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      
      // Restore file to UI on error
      const revertFiles = [...newFiles];
      revertFiles.splice(index, 0, fileToDelete);
      
      await setFiles(revertFiles);
      
      toast({
        title: "Error",
        description: errorMessage || "Failed to delete file. Please try again.",
        variant: "destructive",
      });
    }
  }, [getFiles, setFiles, toast, successMessage, errorMessage]);

  return { handleDeleteFile };
} 