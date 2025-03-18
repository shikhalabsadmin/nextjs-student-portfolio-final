import { UseFormReturn } from "react-hook-form";
import { AssignmentFormValues } from "@/lib/validations/assignment";
import { AssignmentFile } from "@/types/file";
import { handleFileUpload, deleteAssignmentFile } from "@/lib/services/file-upload.service";
import { validateFileType, validateFileSize } from "@/lib/utils/file-validation.utils";
import { isYouTubeUrl, getVideoId, fetchYouTubeVideoTitle } from "@/lib/utils/youtube.utils";
import { useToast } from "@/components/ui/use-toast";
import { Image, FileText, Music, Video, FileSpreadsheet, Presentation } from "lucide-react";
import React from "react";

interface FileIconProps {
  type: string;
}

export function useBasicInfoStep(form: UseFormReturn<AssignmentFormValues>) {
  const { toast } = useToast();
  const files = form.watch("files") as AssignmentFile[] || [];
  const youtubeLinks = form.watch("youtubelinks") || [{ url: "", title: "" }];
  const assignmentId = form.watch("id");

  const handleFiles = async (fileList: FileList) => {
    try {
      const invalidFiles = Array.from(fileList).filter(
        file => !validateFileType(file) || !validateFileSize(file)
      );

      if (invalidFiles.length > 0) {
        toast({
          title: "Invalid files",
          description: "Files must be under 50MB and in a supported format.",
          variant: "destructive",
        });
        return;
      }

      const uploadedFiles = await handleFileUpload(fileList, assignmentId);
      form.setValue("files", [...files, ...uploadedFiles]);
      toast({
        title: "Success",
        description: "Files uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading files:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your files.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFile = async (file: AssignmentFile, index: number) => {
    try {
      if (file.id && file.file_url) {
        await deleteAssignmentFile(file.id, file.file_url);
      }
      const newFiles = [...files];
      newFiles.splice(index, 1);
      form.setValue("files", newFiles);
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const handleYoutubeUrl = async (url: string) => {
    try {
      if (!isYouTubeUrl(url)) {
        throw new Error("Please enter a valid YouTube URL");
      }

      const videoId = getVideoId(url);
      if (!videoId) {
        throw new Error("Invalid YouTube URL");
      }

      // Fetch the actual video title
      const title = await fetchYouTubeVideoTitle(videoId);
      if (!title) {
        throw new Error("Could not fetch video title");
      }

      const newYoutubeLinks = [...youtubeLinks];
      const emptyIndex = newYoutubeLinks.findIndex(link => !link.url);
      
      if (emptyIndex !== -1) {
        newYoutubeLinks[emptyIndex] = { url, title };
      } else {
        newYoutubeLinks.push({ url, title });
      }

      form.setValue("youtubelinks", newYoutubeLinks);
      toast({
        title: "Success",
        description: "YouTube video added successfully",
      });
      return true;
    } catch (error) {
      toast({
        title: "Invalid URL",
        description: error instanceof Error ? error.message : "Please enter a valid YouTube URL.",
        variant: "destructive",
      });
      return false;
    }
  };

  const FileIcon: React.FC<FileIconProps> = ({ type }) => {
    const iconProps = {
      className: "w-4 h-4",
      strokeWidth: 2
    };

    switch (type) {
      case 'youtube':
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-red-50 rounded">
            <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
        );
      case 'image':
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded">
            <Image {...iconProps} className="w-4 h-4 text-blue-600" />
          </div>
        );
      case 'audio':
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-purple-50 rounded">
            <Music {...iconProps} className="w-4 h-4 text-purple-600" />
          </div>
        );
      case 'video':
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-pink-50 rounded">
            <Video {...iconProps} className="w-4 h-4 text-pink-600" />
          </div>
        );
      case 'pdf':
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-red-50 rounded">
            <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <line x1="10" y1="9" x2="8" y2="9"></line>
            </svg>
          </div>
        );
      case 'excel':
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-green-50 rounded">
            <FileSpreadsheet {...iconProps} className="w-4 h-4 text-green-600" />
          </div>
        );
      case 'powerpoint':
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-orange-50 rounded">
            <Presentation {...iconProps} className="w-4 h-4 text-orange-600" />
          </div>
        );
      case 'doc':
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded">
            <FileText {...iconProps} className="w-4 h-4 text-blue-600" />
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-gray-50 rounded">
            <FileText {...iconProps} className="w-4 h-4 text-gray-600" />
          </div>
        );
    }
  };

  return {
    handleFiles,
    handleDeleteFile,
    handleYoutubeUrl,
    FileIcon
  };
} 