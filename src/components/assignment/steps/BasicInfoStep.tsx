import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFormValues } from "@/lib/validations/assignment";
import type { AssignmentFile } from "@/types/file";
import { MONTHS } from "@/constants/months";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Upload, X, Image, FileText, Music, Video, FileSpreadsheet, Presentation } from "lucide-react";
import { handleFileUpload, deleteAssignmentFile, diagnoseTableIssues } from "@/lib/services/file-upload.service";
import { validateFileType, validateFileSize } from "@/lib/utils/file-validation.utils";
import { formatFileSize } from "@/lib/utils/file-type.utils";
import { isYouTubeUrl, getYouTubeVideoTitle } from "@/lib/utils/youtube.utils";
import { useToast } from "@/components/ui/use-toast";

interface BasicInfoStepProps {
  form: UseFormReturn<AssignmentFormValues>;
}

export function BasicInfoStep({ form }: BasicInfoStepProps) {
  console.log("form", form.getValues());
  const { toast } = useToast();
  const files = form.watch("files") as AssignmentFile[] || [];
  const youtubeLinks = form.watch("youtubelinks") || [{ url: "", title: "" }];
  const assignmentId = form.watch("id");

  const handleFiles = async (fileList: FileList) => {
    try {
      const invalidFiles = Array.from(fileList).filter(
        file => !validateFileType(file) || !validateFileSize(file)
      );

      if (invalidFiles.length > 0) {
        toast({
          title: "Invalid files",
          description: "Files must be under 50MB and in a supported format.",
          variant: "destructive",
        });
        return;
      }

      const uploadedFiles = await handleFileUpload(fileList, assignmentId);
      form.setValue("files", [...files, ...uploadedFiles]);
      toast({
        title: "Success",
        description: "Files uploaded successfully",
      });
      
      // If there are issues with files not appearing in the table
      if (uploadedFiles.length > 0 && import.meta.env.DEV) {
        console.log('Running database diagnostics...');
        // Run diagnostics asynchronously
        diagnoseTableIssues().catch(console.error);
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your files.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFile = async (file: AssignmentFile, index: number) => {
    try {
      if (file.id && file.file_url) {
        await deleteAssignmentFile(file.id, file.file_url);
      }
      const newFiles = [...files];
      newFiles.splice(index, 1);
      form.setValue("files", newFiles);
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const handleYoutubeUrl = async (url: string) => {
    try {
      if (!isYouTubeUrl(url)) {
        throw new Error("Please enter a valid YouTube URL");
      }

      const title = await getYouTubeVideoTitle(url);
      const newYoutubeLinks = [...youtubeLinks];
      
      // Find first empty slot or add to end
      const emptyIndex = newYoutubeLinks.findIndex(link => !link.url);
      if (emptyIndex !== -1) {
        newYoutubeLinks[emptyIndex] = { url, title };
      } else {
        newYoutubeLinks.push({ url, title });
      }

      form.setValue("youtubelinks", newYoutubeLinks);
      return true;
    } catch (error) {
      toast({
        title: "Invalid URL",
        description: error instanceof Error ? error.message : "Please enter a valid YouTube URL.",
        variant: "destructive",
      });
      return false;
    }
  };

  const FileIcon = ({ type }: { type: string }) => {
    const iconProps = {
      className: "w-4 h-4",
      strokeWidth: 2
    };

    switch (type) {
      case 'youtube':
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-red-50 rounded">
            <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
        );
      case 'image':
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded">
            <Image {...iconProps} className="w-4 h-4 text-blue-600" />
          </div>
        );
      case 'audio':
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-purple-50 rounded">
            <Music {...iconProps} className="w-4 h-4 text-purple-600" />
          </div>
        );
      case 'video':
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-pink-50 rounded">
            <Video {...iconProps} className="w-4 h-4 text-pink-600" />
          </div>
        );
      case 'pdf':
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-red-50 rounded">
            <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <line x1="10" y1="9" x2="8" y2="9"></line>
            </svg>
          </div>
        );
      case 'excel':
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-green-50 rounded">
            <FileSpreadsheet {...iconProps} className="w-4 h-4 text-green-600" />
          </div>
        );
      case 'powerpoint':
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-orange-50 rounded">
            <Presentation {...iconProps} className="w-4 h-4 text-orange-600" />
          </div>
        );
      case 'doc':
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded">
            <FileText {...iconProps} className="w-4 h-4 text-blue-600" />
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-gray-50 rounded">
            <FileText {...iconProps} className="w-4 h-4 text-gray-600" />
          </div>
        );
    }
  };

  return (
    <div className="space-y-8">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium text-gray-900">
              What is the name of your work? <span className="text-red-500">*</span>
            </FormLabel>
            <FormDescription className="text-sm text-gray-600">
              Give your artifact a meaningful title that represents your work.
            </FormDescription>
            <FormControl>
              <Input
                placeholder='Example: "Solar System Model"'
                className="mt-2"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="artifact_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium text-gray-900">
              What type of work is this? <span className="text-red-500">*</span>
            </FormLabel>
            <FormDescription className="text-sm text-gray-600">
              Artifact Type refers to whether the work is a project, essay, model, performance, presentation, or another specific format.
            </FormDescription>
            <FormControl>
              <Input
                placeholder='Example: "This artefact is a essay"'
                className="mt-2"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="month"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium text-gray-900">
              When did you complete this? <span className="text-red-500">*</span>
            </FormLabel>
            <FormDescription className="text-sm text-gray-600">
              Select the month in which you worked on this artifact.
            </FormDescription>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="----- Select Month -----" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {MONTHS.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="files"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium text-gray-900">
              Upload your work <span className="text-red-500">*</span>
            </FormLabel>
            <FormDescription className="text-sm text-gray-600">
              Upload files or add YouTube links to your work (at least one is required)
            </FormDescription>
            <div className="mt-2 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-2 text-gray-600"
                onClick={() => {
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
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files) {
                      handleFiles(files);
                    }
                  };
                  input.click();
                }}
              >
                <Upload className="h-4 w-4" />
                Upload Files
              </Button>
              <div className="flex-1 flex items-center gap-2">
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
                  className="text-gray-600 w-10 h-10"
                  onClick={async () => {
                    const urlInput = document.querySelector('input[placeholder="Add YouTube URL"]') as HTMLInputElement;
                    if (urlInput && urlInput.value && await handleYoutubeUrl(urlInput.value)) {
                      urlInput.value = '';
                    }
                  }}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Display Files */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-sm font-medium text-gray-700">Files</div>
                {files.map((file, index) => (
                  <div key={file.id || index} className="flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-lg">
                    <FileIcon type={file.file_type} />
                    <span className="text-sm font-medium text-gray-900">{file.file_name}</span>
                    <span className="text-sm text-gray-500 ml-auto">
                      {formatFileSize(file.file_size)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleDeleteFile(file, index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Display YouTube Links */}
            {youtubeLinks.some(link => link.url) && (
              <div className="mt-4 space-y-2">
                <div className="text-sm font-medium text-gray-700">YouTube Links</div>
                {youtubeLinks.map((link, index) => {
                  if (!link.url) return null;
                  return (
                    <div key={index} className="flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-center w-8 h-8 bg-red-50 rounded">
                        <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{link.title || 'YouTube Video'}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 ml-auto"
                        onClick={() => {
                          const newLinks = [...youtubeLinks];
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
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
} 