import React from 'react';
import { getFileTypeCategory } from '@/lib/utils/file-type.utils';
import { FileIcon } from './file-icon';
import type { AssignmentFile } from '@/types/file';
import { UploadProgress } from "@/components/ui/upload-progress";

type YouTubeLink = {
  url?: string;
  title?: string;
  type?: string;
};

interface FilePreviewProps {
  file: File | AssignmentFile | YouTubeLink;
  className?: string;
  showControls?: boolean;
  showDelete?: boolean;
  onDelete?: () => void;
}

export function FilePreview({ file, className = "", showControls = true, showDelete = false, onDelete }: FilePreviewProps) {
  // Get file type and URL
  let fileType: string, fileUrl: string, fileName: string;
  
  // Extract YouTube video ID
  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

  // Handle YouTube link type
  if ('url' in file && file.url) {
    fileType = file.type || 'youtube';
    fileUrl = file.url;
    fileName = file.title || 'YouTube Video';
  } else if (file instanceof File) {
    // Handle File type
    fileType = getFileTypeCategory(file.type);
    fileUrl = URL.createObjectURL(file);
    fileName = file.name;
  } else {
    // Handle AssignmentFile type
    fileType = (file as AssignmentFile).file_type;
    fileUrl = (file as AssignmentFile).file_url;
    fileName = (file as AssignmentFile).file_name;
  }
  
  // Clean up object URL on unmount if it's a File
  React.useEffect(() => {
    if (file instanceof File) {
      return () => URL.revokeObjectURL(fileUrl);
    }
  }, [file, fileUrl]);

  // Use consistent card structure but preserve aspect ratio
  const baseClasses = `w-full rounded-lg overflow-hidden border border-gray-200 ${className}`;
  const cardHeight = "h-[320px]"; // Total card height
  const mediaContainerClass = "h-[250px] bg-gray-50"; // Fixed height for media container

  // Check if this file is currently uploading (AssignmentFile with uploadProgress < 100)
  const isUploading = !('url' in file) && !(file instanceof File) && 
                     'uploadProgress' in file && 
                     typeof file.uploadProgress === 'number';
  
  // For debugging - log file info with progress state
  if (!('url' in file) && !(file instanceof File) && 'file_name' in file) {
    console.log(`[DEBUG PROGRESS BAR] FilePreview for ${(file as AssignmentFile).file_name}:`, {
      isUploading,
      hasUploadProgress: 'uploadProgress' in file,
      progressValue: (file as AssignmentFile).uploadProgress
    });
  }

  // Get the upload progress value with proper bounds
  const getUploadProgress = (): number => {
    if (!('url' in file) && !(file instanceof File) && 'uploadProgress' in file) {
      const rawProgress = (file as AssignmentFile).uploadProgress;
      console.log(`[DEBUG PROGRESS BAR] Raw progress for ${(file as AssignmentFile).file_name}: ${rawProgress}`);
      
      // Handle undefined, null or NaN cases
      if (rawProgress === undefined || rawProgress === null || isNaN(rawProgress)) {
        console.warn(`[DEBUG PROGRESS BAR] Invalid progress value (${rawProgress}) for ${(file as AssignmentFile).file_name}`);
        return 0;
      }
      
      // Ensure progress is between 0-100
      const safeProgress = Math.max(0, Math.min(100, Math.round(rawProgress)));
      console.log(`[DEBUG PROGRESS BAR] Normalized progress for ${(file as AssignmentFile).file_name}: ${safeProgress}%`);
      return safeProgress;
    }
    return 0;
  };

  // Special case for YouTube links
  if (fileType === 'youtube') {
    const videoId = getYouTubeVideoId(fileUrl);

  return (
      <div className={`${baseClasses} ${cardHeight} flex flex-col`}>
        <div className={`${mediaContainerClass} flex-1 overflow-hidden`}>
          {videoId ? (
            <iframe 
              src={`https://www.youtube.com/embed/${videoId}`}
              className="w-full h-full border-0" 
              title={fileName}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4">
              <FileIcon type="youtube" />
              <p className="text-sm text-gray-500 mt-3">Unable to embed this YouTube video</p>
            </div>
          )}
        </div>
        {isUploading && (
          <div className="px-3 py-2">
            <UploadProgress 
              fileName={fileName} 
              progress={getUploadProgress()} 
            />
          </div>
        )}
        {showControls && (
          <div className="p-2 bg-gray-50 flex items-center justify-between mt-auto">
            <span className="text-sm text-gray-700 truncate">{fileName}</span>
            <a 
              href={fileUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs text-blue-600 hover:underline"
            >
              View on YouTube
            </a>
          </div>
        )}
      </div>
    );
  }

  // Render based on file type
  switch (fileType) {
    case 'image':
      return (
        <div className={`${baseClasses} ${cardHeight} flex flex-col`}>
          <div className={`${mediaContainerClass} flex-1 flex items-center justify-center overflow-hidden`}>
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={fileUrl}
                alt={fileName}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
          {isUploading && (
            <div className="px-3 py-2">
              <UploadProgress 
                fileName={fileName} 
                progress={getUploadProgress()} 
              />
            </div>
          )}
          {showControls && (
            <div className="p-2 bg-gray-50 flex items-center justify-between mt-auto">
              <span className="text-sm text-gray-700 truncate">{fileName}</span>
              <a 
                href={fileUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs text-blue-600 hover:underline"
              >
                View
              </a>
            </div>
          )}
        </div>
      );
    
    case 'video':
      return (
        <div className={`${baseClasses} ${cardHeight} flex flex-col`}>
          <div className={`${mediaContainerClass} flex-1 flex items-center justify-center overflow-hidden`}>
            <div className="relative w-full h-full flex items-center justify-center">
              <video 
                src={fileUrl} 
                controls 
                className="max-w-full max-h-full"
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
          {isUploading && (
            <div className="px-3 py-2">
              <UploadProgress 
                fileName={fileName} 
                progress={getUploadProgress()} 
              />
            </div>
          )}
          {showControls && (
            <div className="p-2 bg-gray-50 flex items-center justify-between mt-auto">
              <span className="text-sm text-gray-700 truncate">{fileName}</span>
              <a 
                href={fileUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs text-blue-600 hover:underline"
              >
                Download
              </a>
            </div>
          )}
        </div>
      );
    
    case 'audio':
      return (
        <div className={`${baseClasses} ${cardHeight} flex flex-col`}>
          <div className={`${mediaContainerClass} flex-1 p-4 flex flex-col justify-center`}>
            <div className="flex items-center gap-3 mb-6">
              <FileIcon type="audio" />
              <div className="flex-1 truncate">
                <p className="text-sm font-medium text-gray-700 truncate">{fileName}</p>
              </div>
            </div>
            <div className="flex-1 flex items-center">
              <audio 
                src={fileUrl} 
                controls 
                className="w-full"
                preload="metadata"
              >
                Your browser does not support the audio tag.
              </audio>
            </div>
          </div>
          {isUploading && (
            <div className="px-3 py-2">
              <UploadProgress 
                fileName={fileName} 
                progress={getUploadProgress()} 
              />
            </div>
          )}
          {showControls && (
            <div className="p-2 bg-gray-50 flex items-center justify-between mt-auto">
              <span className="text-sm text-gray-700 truncate">{fileName}</span>
              <a 
                href={fileUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs text-blue-600 hover:underline"
              >
                Download
              </a>
            </div>
          )}
        </div>
      );
    
    case 'pdf':
      return (
        <div className={`${baseClasses} ${cardHeight} flex flex-col`}>
          <div className={`${mediaContainerClass} flex-1 overflow-hidden`}>
            <iframe 
              src={`${fileUrl}#toolbar=0&view=FitH`} 
              className="w-full h-full border-0" 
              title={fileName}
            />
          </div>
          {isUploading && (
            <div className="px-3 py-2">
              <UploadProgress 
                fileName={fileName} 
                progress={getUploadProgress()} 
              />
            </div>
          )}
          {showControls && (
            <div className="p-2 bg-gray-50 flex items-center justify-between mt-auto">
              <span className="text-sm text-gray-700 truncate">{fileName}</span>
              <a 
                href={fileUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs text-blue-600 hover:underline"
              >
                Open
              </a>
            </div>
          )}
        </div>
      );
    
    // For other file types (doc, excel, powerpoint, etc.) just show file icon and name
    default:
      return (
        <div className={`${baseClasses} ${cardHeight} flex flex-col`}>
          <div className={`${mediaContainerClass} flex-1 p-6 flex flex-col justify-center`}>
            <div className="flex items-center gap-4 mb-3">
              <FileIcon type={fileType} />
              <div className="flex-1 truncate">
                <p className="text-sm font-medium text-gray-700 truncate">{fileName}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              This file type cannot be previewed. Click the download button below to view it.
            </p>
          </div>
          {isUploading && (
            <div className="px-3 py-2">
              <UploadProgress 
                fileName={fileName} 
                progress={getUploadProgress()} 
              />
            </div>
          )}
          {showControls && (
            <div className="p-2 bg-gray-50 flex items-center justify-between mt-auto">
              <span className="text-sm text-gray-700 truncate">{fileName}</span>
              <a 
                href={fileUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs text-blue-600 hover:underline"
              >
                Download
              </a>
            </div>
          )}
    </div>
  );
  }
} 