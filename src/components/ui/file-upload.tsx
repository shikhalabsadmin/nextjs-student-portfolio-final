import { ChangeEvent, useRef } from "react";
import { Button } from "./button";
import { Upload } from "lucide-react";

interface FileUploadProps {
  onUpload: (files: (File | string)[]) => void;
  accept?: string;
  multiple?: boolean;
  currentFiles?: (File | string)[];
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUpload, accept, multiple, currentFiles = [] }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const updatedFiles = [...currentFiles, ...newFiles];
      onUpload(updatedFiles);
      
      // Reset the file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept={accept}
        multiple={multiple}
        className="hidden"
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
      >
        <Upload className="h-4 w-4" />
        <span>Choose Files</span>
      </label>
    </div>
  );
}; 