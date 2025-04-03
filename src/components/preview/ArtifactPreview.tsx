import { FileItem } from "@/lib/types/preview";
import { FileText } from "lucide-react";

interface ArtifactPreviewProps {
  files: FileItem[];
}

export function ArtifactPreview({ files }: ArtifactPreviewProps) {
  if (!files || files.length === 0) return null;

  return (
    <div className="grid gap-4">
      {files.map((file, index) => (
        <div
          key={file.file_url || index}
          className="flex items-center gap-4 p-4 rounded-lg bg-white border border-gray-100 hover:border-blue-200 transition-colors shadow-sm"
        >
          <div className="h-12 w-12 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <a
              href={file.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-medium text-blue-600 hover:text-blue-800 truncate block"
            >
              {file.file_name || (file.file_url && new URL(file.file_url).pathname.split("/").pop())}
            </a>
            <p className="text-base text-slate-700 truncate">
              Document
            </p>
          </div>
        </div>
      ))}
    </div>
  );
} 