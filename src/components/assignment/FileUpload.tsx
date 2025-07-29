import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { FileText, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { AssignmentFile } from "@/types/file";
import { uploadAssignmentFile } from "@/lib/api/assignments";
import { validateFileType, validateFileSize } from "@/lib/utils/file-validation.utils";

interface FileUploadProps {
  value?: AssignmentFile[];
  onChange: (files: AssignmentFile[]) => void;
  maxSize?: number;
  accept?: Record<string, string[]>;
}

export function FileUpload({
  value = [],
  onChange,
  maxSize = 1024 * 1024 * 1024, // 1GB
  accept,
}: FileUploadProps) {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      try {
        // Validate files before upload
        const invalidFiles = acceptedFiles.filter(
          file => !validateFileType(file) || !validateFileSize(file)
        );

        if (invalidFiles.length > 0) {
          toast.error("Some files are invalid. Please check the file types and sizes.");
          return;
        }

        const newFiles = await Promise.all(
          acceptedFiles.map(async (file) => {
            const uploadedFile = await uploadAssignmentFile(file);
            return {
              file_url: uploadedFile.file_url,
              file_name: uploadedFile.file_name,
              file_type: uploadedFile.file_type,
              file_size: uploadedFile.file_size,
            } as AssignmentFile;
          })
        );

        onChange([...value, ...newFiles]);
        toast.success("Files uploaded successfully");
      } catch (error) {
        console.error("Error uploading files:", error);
        toast.error("Failed to upload files");
      }
    },
    [onChange, value]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    accept,
  });

  const removeFile = (index: number) => {
    const newFiles = [...value];
    newFiles.splice(index, 1);
    onChange(newFiles);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-[#62C59F] bg-[#62C59F]/5"
            : "border-gray-200 hover:border-gray-300"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <Upload className="w-8 h-8 text-gray-400" />
          <div className="text-sm text-gray-600">
            {isDragActive ? (
              <p>Drop the files here ...</p>
            ) : (
              <p>
                Drag & drop files here, or{" "}
                <span className="text-[#62C59F]">browse</span>
              </p>
            )}
          </div>
          <p className="text-xs text-gray-400">
            Supported formats: Images, PDF, DOC, PPT, Videos
          </p>
          <p className="text-xs text-gray-400">Max size: 1GB</p>
        </div>
      </div>

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((file, index) => (
            <div
              key={file.file_url}
              className="flex items-center justify-between p-2 rounded-lg bg-white/40"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <a
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 truncate max-w-[300px]"
                >
                  {file.file_name}
                </a>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-gray-900"
                onClick={() => removeFile(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 