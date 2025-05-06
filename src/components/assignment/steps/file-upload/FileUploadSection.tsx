import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import type { AssignmentFile } from "@/types/file";

interface FileUploadSectionProps {
  files: AssignmentFile[];
  youtubeLinks: { url?: string; title?: string }[];
  handleFiles: (files: FileList) => Promise<void>;
  handleYoutubeUrl: (url: string) => Promise<boolean>;
  isMobile: boolean;
}

export function FileUploadSection({
  handleFiles,
  handleYoutubeUrl,
  isMobile
}: FileUploadSectionProps) {
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
    const urlInput = document.querySelector('input[placeholder="Add YouTube URL"]') as HTMLInputElement;
    if (urlInput && urlInput.value && await handleYoutubeUrl(urlInput.value)) {
      urlInput.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload controls */}
      <div className={`mt-2 ${isMobile ? 'flex flex-col space-y-3' : 'flex items-center gap-2'}`}>
        <Button
          type="button"
          variant="outline"
          className={`flex items-center gap-2 text-gray-600 ${isMobile ? 'w-full justify-center' : ''}`}
          onClick={handleFileSelect}
        >
          <Upload className="h-4 w-4" />
          Upload Files
        </Button>
        <div className={`${isMobile ? 'w-full' : 'flex-1'} flex items-center gap-2`}>
          <Input
            placeholder="Add YouTube URL"
            className="flex-1"
            onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                const input = e.target as HTMLInputElement;
                if (await handleYoutubeUrl(input.value)) {
                  input.value = '';
                }
              }
            }}
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="text-gray-600 w-10 h-10 flex-shrink-0"
            onClick={handleYoutubeSubmit}
          >
            +
          </Button>
        </div>
      </div>
    </div>
  );
} 