import { ChangeEvent, useRef, useState } from "react";
import { Button } from "./button";
import { Upload } from "lucide-react";

export interface FileUploadProps {
  onUpload: (files: (File | string)[]) => void;
  maxFiles?: number;
  accept?: string;
  multiple?: boolean;
}

export function FileUpload({ 
  onUpload, 
  maxFiles = 1,
  accept = "*",
  multiple = false
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentFiles, setCurrentFiles] = useState<(File | string)[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const updatedFiles = [...currentFiles, ...newFiles].slice(0, maxFiles);
      setCurrentFiles(updatedFiles);
      onUpload(updatedFiles);
      
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
} 