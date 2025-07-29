import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { AssignmentFile } from "@/types/file";
import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFormValues } from "@/lib/validations/assignment";
import { useMemo } from "react";
import { FilePreview } from "@/components/ui/file-preview";

interface ExternalLink {
  url?: string;
  title?: string;
  type?: string;
}

interface ExternalLinksProps {
  files: AssignmentFile[];
  externalLinks: ExternalLink[];
  handleDeleteFile: (file: AssignmentFile, index: number) => Promise<void>;
  form: UseFormReturn<AssignmentFormValues>;
  FileIcon: React.FC<{ type: string }>;
  isMobile: boolean;
}

export function ExternalLinksSection({
  files,
  externalLinks,
  handleDeleteFile,
  form,
  FileIcon,
  isMobile
}: ExternalLinksProps) {
  // Filter out any files marked as process documentation
  const nonProcessFiles = useMemo(() => 
    files?.filter(file => file && file.is_process_documentation !== true) || [], 
    [files]
  );

  // Check if there are any valid external links
  const validExternalLinks = useMemo(() => 
    externalLinks?.filter(link => link && link.url) || [],
    [externalLinks]
  );

  // Calculate if we have any content to display
  const hasContent = nonProcessFiles.length > 0 || validExternalLinks.length > 0;

  if (!hasContent) return null;

  return (
    <div className="mt-4">
      <div className={isMobile ? 'space-y-3' : 'grid grid-cols-2 gap-3'}>
        {/* Display Files */}
        {nonProcessFiles.map((file, index) => {
          if (!file) return null;
          
          // Find the original index in the full files array
          const originalIndex = files.findIndex(f => 
            f && f.id === file.id && 
            f.file_url === file.file_url
          );
          
          return (
            <div key={`file-${file.id || index}`} className="relative">
              <FilePreview file={file} />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 rounded-full"
                onClick={() => handleDeleteFile(file, originalIndex !== -1 ? originalIndex : index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          );
        })}

        {/* Display External Links */}
        {validExternalLinks.map((link, index) => (
          <div key={`external-${index}`} className="relative">
            <FilePreview file={link} />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 rounded-full"
              onClick={() => {
                const newLinks = [...(externalLinks || [])];
                newLinks.splice(index, 1);
                if (newLinks.length === 0) {
                  newLinks.push({ url: "", title: "", type: "" });
                }
                form.setValue("externalLinks", newLinks);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
} 