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
import { Upload, X } from "lucide-react";
import { useBasicInfoStep } from "@/hooks/useBasicInfoStep";
import { formatFileSize } from "@/lib/utils/file-type.utils";

interface BasicInfoStepProps {
  form: UseFormReturn<AssignmentFormValues>;
}

export function BasicInfoStep({ form }: BasicInfoStepProps) {
  const files = form.watch("files") as AssignmentFile[] || [];
  const youtubeLinks = form.watch("youtubelinks") || [{ url: "", title: "" }];
  
  const { 
    handleFiles, 
    handleDeleteFile, 
    handleYoutubeUrl, 
    FileIcon 
  } = useBasicInfoStep(form);

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
                      <FileIcon type="youtube" />
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