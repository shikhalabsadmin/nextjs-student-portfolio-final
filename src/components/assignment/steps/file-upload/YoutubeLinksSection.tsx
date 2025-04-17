import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { AssignmentFile } from "@/types/file";
import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFormValues } from "@/lib/validations/assignment";
import { formatFileSize } from "@/lib/utils/file-type.utils";
import { useMemo } from "react";

interface YoutubeLinksProps {
  files: AssignmentFile[];
  youtubeLinks: { url?: string; title?: string }[];
  handleDeleteFile: (file: AssignmentFile, index: number) => Promise<void>;
  form: UseFormReturn<AssignmentFormValues>;
  FileIcon: React.FC<{ type: string }>;
  isMobile: boolean;
}

export function YoutubeLinksSection({
  files,
  youtubeLinks,
  handleDeleteFile,
  form,
  FileIcon,
  isMobile
}: YoutubeLinksProps) {
  // Filter out any files marked as process documentation
  const nonProcessFiles = useMemo(() => 
    files?.filter(file => file && file.is_process_documentation !== true) || [], 
    [files]
  );

  return (
    <>
      {/* Display Files */}
      {nonProcessFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className={`space-y-2 ${isMobile ? 'max-h-60 overflow-y-auto pr-1' : ''}`}>
            {nonProcessFiles.map((file, index) => {
              if (!file) return null;
              
              // Find the original index in the full files array
              const originalIndex = files.findIndex(f => 
                f && f.id === file.id && 
                f.file_url === file.file_url
              );
              
              return (
                <div 
                  key={file.id || index} 
                  className="flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <FileIcon type={file.file_type || ''} />
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        {file.file_url ? (
                          <a
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-gray-900 hover:text-gray-600 truncate"
                            title={file.file_name || ''}
                          >
                            {file.file_name || 'Unnamed file'}
                          </a>
                        ) : (
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {file.file_name || 'Unnamed file'}
                          </span>
                        )}
                        <span className="text-sm text-gray-500 shrink-0">
                          {formatFileSize(file.file_size || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 ml-2 shrink-0"
                    onClick={() => handleDeleteFile(file, originalIndex !== -1 ? originalIndex : index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Display YouTube Links */}
      {Array.isArray(youtubeLinks) && youtubeLinks.some(link => link?.url) && (
        <div className="mt-4 space-y-2">
          {youtubeLinks.map((link, index) => {
            if (!link?.url) return null;
            return (
              <div 
                key={index} 
                className="flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <FileIcon type="youtube" />
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <a 
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-gray-900 hover:text-gray-600 truncate"
                        title={link.title || link.url}
                      >
                        {link.title || link.url || 'Loading...'}
                      </a>
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 ml-2 shrink-0"
                  onClick={() => {
                    const newLinks = [...(youtubeLinks || [])];
                    newLinks.splice(index, 1);
                    if (newLinks.length === 0) {
                      newLinks.push({ url: "", title: "" });
                    }
                    form.setValue("youtubelinks", newLinks);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}