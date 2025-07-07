import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Youtube } from "lucide-react";
import type { AssignmentFile } from "@/types/file";
import { Alert } from "@/components/ui/alert";

interface FileUploadSectionProps {
  files: AssignmentFile[];
  youtubeLinks: { url?: string; title?: string }[];
  handleFiles: (files: FileList) => Promise<void>;
  handleYoutubeUrl: (url: string) => Promise<boolean>;
  isMobile: boolean;
}

export function FileUploadSection({
  files,
  youtubeLinks,
  handleFiles,
  handleYoutubeUrl,
  isMobile
}: FileUploadSectionProps) {
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [youtubeInputValue, setYoutubeInputValue] = useState("");
  
  // Check if either files or youtube links are present
  const hasContent = files.length > 0 || youtubeLinks.some(link => link?.url && link.url.trim() !== "");
  
  const handleFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = [
      'image/*',
      'audio/*',
      'video/*',
      '.pdf',
      '.doc,.docx',
      '.xls,.xlsx',
      '.ppt,.pptx',
      '.txt'
    ].join(',');
    
    input.onchange = async (e) => {
      const fileList = (e.target as HTMLInputElement).files;
      if (!fileList || fileList.length === 0) return;
      await handleFiles(fileList);
    };
    input.click();
  };

  const handleYoutubeSubmit = async () => {
    if (youtubeInputValue.trim()) {
      if (await handleYoutubeUrl(youtubeInputValue)) {
        setYoutubeInputValue("");
        setShowYoutubeInput(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      {!hasContent && (
        <Alert className="bg-blue-50 border-blue-200 text-blue-800">
          <p>You need to upload files, add YouTube links, or both to continue to the next step.</p>
        </Alert>
      )}
      
      {/* Upload controls */}
      <div className={`mt-2 ${isMobile ? 'flex flex-col space-y-3' : 'flex flex-col space-y-3'}`}>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-2 text-gray-600"
            onClick={handleFileSelect}
          >
            <Upload className="h-4 w-4" />
            Upload Files
          </Button>
          
          {!showYoutubeInput && (
            <Button
              type="button"
              variant="outline"
              className="flex items-center gap-2 text-gray-600"
              onClick={() => setShowYoutubeInput(true)}
            >
              <Youtube className="h-4 w-4" />
              Add YouTube URL
            </Button>
          )}
        </div>
        
        {showYoutubeInput && (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Paste YouTube video URL here"
              className="flex-1"
              value={youtubeInputValue}
              onChange={(e) => setYoutubeInputValue(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  await handleYoutubeSubmit();
                } else if (e.key === 'Escape') {
                  setShowYoutubeInput(false);
                  setYoutubeInputValue("");
                }
              }}
              autoFocus
            />
            <Button
              type="button"
              variant="outline"
              className="text-gray-600"
              onClick={handleYoutubeSubmit}
            >
              Add
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-gray-600"
              onClick={() => {
                setShowYoutubeInput(false);
                setYoutubeInputValue("");
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 