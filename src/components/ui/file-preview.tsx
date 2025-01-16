import { File as FileIcon, X } from "lucide-react";

interface FilePreviewProps {
  file: File | string;
  onDelete: () => void;
}

const getFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const FilePreview = ({ file, onDelete }: FilePreviewProps) => {
  // Extract filename from URL if it's a string
  const getDisplayName = (file: File | string) => {
    if (file instanceof File) return file.name;
    try {
      const url = new URL(file);
      const pathParts = url.pathname.split('/');
      return decodeURIComponent(pathParts[pathParts.length - 1].split('-').slice(1).join('-'));
    } catch {
      return file;
    }
  };

  return (
    <div className="flex items-center justify-between p-2 rounded bg-gray-50">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <FileIcon className="h-4 w-4 shrink-0 text-gray-400" />
        <span className="text-sm text-gray-600 truncate">
          {getDisplayName(file)}
        </span>
        <span className="text-xs text-gray-400 shrink-0">
          {file instanceof File ? `(${getFileSize(file.size)})` : ''}
        </span>
      </div>
      <button onClick={onDelete} className="p-1 hover:bg-gray-200 rounded-full shrink-0 ml-2">
        <X className="h-4 w-4 text-gray-500" />
      </button>
    </div>
  );
}; 