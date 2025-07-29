import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, LinkIcon } from "lucide-react";
import type { AssignmentFile } from "@/types/file";
import { Alert } from "@/components/ui/alert";

interface ExternalLink {
  url?: string;
  title?: string;
  type?: string;
}

interface FileUploadSectionProps {
  files: AssignmentFile[];
  externalLinks: ExternalLink[];
  handleFiles: (files: FileList) => Promise<void>;
  handleExternalUrl: (url: string) => Promise<boolean>;
  isMobile: boolean;
}

export function FileUploadSection({
  files,
  externalLinks,
  handleFiles,
  handleExternalUrl,
  isMobile
}: FileUploadSectionProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkInputValue, setLinkInputValue] = useState("");
  
  // Check if either files or external links are present
  const hasContent = files.length > 0 || externalLinks.some(link => link?.url && link.url.trim() !== "");
  
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

  const handleLinkSubmit = async () => {
    if (linkInputValue.trim()) {
      if (await handleExternalUrl(linkInputValue)) {
        setLinkInputValue("");
        setShowLinkInput(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      {!hasContent && (
        <Alert className="bg-blue-50 border-blue-200 text-blue-800">
          <p>You need to upload files, add external links, or both to continue to the next step.</p>
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
          
          {!showLinkInput && (
            <Button
              type="button"
              variant="outline"
              className="flex items-center gap-2 text-gray-600"
              onClick={() => setShowLinkInput(true)}
            >
              <LinkIcon className="h-4 w-4" />
              Add External Link
            </Button>
          )}
        </div>
        
        {showLinkInput && (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Paste URL here (YouTube, Google Drive, Canva, etc.)"
              className="flex-1"
              value={linkInputValue}
              onChange={(e) => setLinkInputValue(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  await handleLinkSubmit();
                } else if (e.key === 'Escape') {
                  setShowLinkInput(false);
                  setLinkInputValue("");
                }
              }}
              autoFocus
            />
            <Button
              type="button"
              variant="outline"
              className="text-gray-600"
              onClick={handleLinkSubmit}
            >
              Add
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-gray-600"
              onClick={() => {
                setShowLinkInput(false);
                setLinkInputValue("");
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