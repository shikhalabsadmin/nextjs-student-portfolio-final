import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Upload, X, FileIcon, Image as ImageIcon, FileText, Film, Download, Eye, Trash2 } from "lucide-react";
import { Question } from "./QuestionTypes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

interface QuestionFieldProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  uploadProgress?: { [key: string]: number };
  handleFileUpload?: (value: any) => void;
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
  if (fileType.startsWith('video/')) return <Film className="h-4 w-4" />;
  if (fileType.startsWith('text/') || fileType.includes('pdf')) return <FileText className="h-4 w-4" />;
  return <FileIcon className="h-4 w-4" />;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const QuestionField = ({ question, value, onChange, uploadProgress = {}, handleFileUpload }: QuestionFieldProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0 && handleFileUpload) {
      handleFileUpload(droppedFiles);
    }
  };

  if (question.type === "richtext") {
    return (
      <RichTextEditor
        value={value || ""}
        onChange={onChange}
      />
    );
  }

  if (question.type === "boolean") {
    return (
      <div className="space-y-3">
        <label className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
          <input
            type="radio"
            checked={value === true}
            onChange={() => onChange(true)}
            className="h-4 w-4 text-[#62C59F]"
          />
          <span className="text-gray-700">Yes</span>
        </label>
        <label className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
          <input
            type="radio"
            checked={value === false}
            onChange={() => onChange(false)}
            className="h-4 w-4 text-[#62C59F]"
          />
          <span className="text-gray-700">No</span>
        </label>
      </div>
    );
  }

  if (question.type === "file") {
    const handleFileSelect = (files: FileList | null) => {
      if (!files?.length) return;
      
      const fileArray = Array.from(files);
      console.log('[DEBUG] File input change event:', files);
      console.log('[DEBUG] Existing files:', value);
      
      // Only update the form state with the new files
      // The actual file list will be updated after successful upload
      if (handleFileUpload && fileArray.length > 0) {
        handleFileUpload(fileArray);
      }
    };

    return (
      <div className="space-y-4">
        <label
          className={`block cursor-pointer ${
            isDragActive ? "border-[#62C59F] bg-[#62C59F]/5" : "border-gray-200"
          }`}
        >
          <div
            className="border-2 border-dashed rounded-lg p-6"
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              className="hidden"
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
              onClick={(e) => {
                // Reset file input value to allow selecting the same file again
                (e.target as HTMLInputElement).value = '';
              }}
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <Upload className="h-8 w-8 text-gray-400" />
              <div className="mb-2 text-lg text-gray-500">
                <span className="font-medium text-[#62C59F] hover:text-[#62C59F]/80">
                  Upload files
                </span>
                <span className="pl-1">or drag and drop</span>
              </div>
              <p className="text-base text-gray-500">
                Upload multiple files of any type
              </p>
            </div>
          </div>
        </label>

        {value && (
          <div className="space-y-2">
            {(Array.isArray(value) ? value : [value]).map((file, index) => {
              const fileName = file instanceof File ? file.name : 
                typeof file === 'string' ? file.split('/').pop() : 'Unknown file';
              
              const fileType = file instanceof File ? file.type : 
                fileName.split('.').pop()?.toLowerCase() || '';
              
              const fileSize = file instanceof File ? file.size : 0;
              
              const isImage = file instanceof File ? 
                file.type.startsWith('image/') : 
                ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType);

              const progress = uploadProgress[fileName] || 0;
              const isUploading = file instanceof File;
              const isUploaded = typeof file === 'string';
              
              return (
                <div 
                  key={`${fileName}-${index}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-grow">
                    <div className="p-2 bg-[#62C59F] bg-opacity-10 rounded-full">
                      {getFileIcon(fileType)}
                    </div>
                    <div className="flex flex-col flex-grow">
                      <div className="flex items-center justify-between">
                        <span className="text-lg text-gray-700">{fileName}</span>
                        {fileSize > 0 && (
                          <span className="text-base text-gray-500">{formatFileSize(fileSize)}</span>
                        )}
                      </div>
                      {isUploading && (
                        <div className="mt-2">
                          <Progress value={progress} className="h-1" />
                          <span className="text-base text-gray-500 mt-1">{progress.toFixed(0)}% uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isUploaded && (
                      <>
                        <a
                          href={file as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                          title="Preview"
                        >
                          <Eye className="h-4 w-4 text-gray-500" />
                        </a>
                        <a
                          href={file as string}
                          download
                          className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                          title="Download"
                        >
                          <Download className="h-4 w-4 text-gray-500" />
                        </a>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const files = Array.isArray(value) ? value : [value];
                        const newFiles = files.filter((_, i) => i !== index);
                        onChange(newFiles);
                      }}
                      className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                      title="Remove"
                      disabled={isUploading}
                    >
                      <Trash2 className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (question.type === "select") {
    if (question.multiple) {
      return (
        <div className="space-y-2">
          {question.options?.map((option) => (
            <label key={option} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={Array.isArray(value) && value.includes(option)}
                onChange={(e) => {
                  const newValue = Array.isArray(value) ? [...value] : [];
                  if (e.target.checked) {
                    newValue.push(option);
                  } else {
                    const index = newValue.indexOf(option);
                    if (index > -1) {
                      newValue.splice(index, 1);
                    }
                  }
                  onChange(newValue);
                }}
                className="h-4 w-4 text-[#62C59F] rounded"
              />
              <span className="text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      );
    }

    return (
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-white">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          {question.options?.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (question.type === "textarea") {
    const wordCount = (value || "").trim().split(/\s+/).filter(Boolean).length;
    const maxWords = question.maxWords || 2000;
    const suggestedMaxWords = question.maxWords && question.maxWords < 2000 ? question.maxWords : 1500;
    const isOverLimit = wordCount > suggestedMaxWords;

    return (
      <div className="space-y-3">
        {question.followUpQuestions && question.followUpQuestions.length > 0 && (
          <ul className="list-disc pl-5 space-y-1 text-lg text-gray-600">
            {question.followUpQuestions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        )}
        <div className="relative">
          <RichTextEditor
            value={value || ""}
            onChange={onChange}
            placeholder={question.hint}
          />
          <div className="mt-2 flex justify-end">
            <span className={`text-base ${isOverLimit ? "text-red-500" : "text-gray-400"}`}>
              {wordCount}/{suggestedMaxWords} suggested words
            </span>
          </div>
        </div>
        {isOverLimit && (
          <div className="text-base text-red-500">
            Word limit exceeded. Please consider shortening your response.
          </div>
        )}
      </div>
    );
  }

  return (
    <Input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="focus:border-[#62C59F] focus:ring-1 focus:ring-[#62C59F]"
    />
  );
};