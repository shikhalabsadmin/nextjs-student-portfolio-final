import { FileItem } from "@/lib/types/preview";
import { FileText } from "lucide-react";

interface ArtifactPreviewProps {
  files: FileItem[];
}

export function ArtifactPreview({ files }: ArtifactPreviewProps) {
  if (!files || files.length === 0) return null;

  return (
    <div className="grid gap-3">
      {files.map((file) => (
        <div
          key={file.file_url}
          className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100 hover:border-blue-200 transition-colors"
        >
          <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <a
              href={file.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-blue-600 hover:text-blue-800 truncate block"
            >
              {file.file_name}
            </a>
            <p className="text-xs text-gray-500 truncate">
              {file.file_url &&
                new URL(file.file_url).pathname.split("/").pop()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
} 