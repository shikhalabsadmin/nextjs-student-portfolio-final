import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFormValues } from "@/lib/validations/assignment";
import type { AssignmentFile } from "@/types/file";
import { MONTHS } from "@/constants/months";
import { useMemo, memo, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { uploadAssignmentFile, deleteFile } from "@/lib/api/assignments";
import { validateFileType, validateFileSize } from "@/lib/utils/file-validation.utils";
import { isYouTubeUrl, getVideoId, fetchYouTubeVideoTitle } from "@/lib/utils/youtube";
import { FileIcon } from "@/components/ui/file-icon";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { FileUploadSection, YoutubeLinksSection } from "./file-upload";
import { GRADE_SUBJECTS, GradeLevel } from "@/constants/grade-subjects";
import { DatePicker } from "@/components/ui/date-picker";

interface BasicInfoStepProps {
  form: UseFormReturn<AssignmentFormValues>;
}

export function BasicInfoStep({ form }: BasicInfoStepProps) {
  const { toast } = useToast();
  
  const isMobile = useIsMobile();
  const assignmentId = form.getValues("id") ?? "";
  const grade = form.watch("grade") ?? "";
  
  const gradeSubjects = useMemo(() => 
    grade ? GRADE_SUBJECTS[grade as GradeLevel] || [] : []
  , [grade]);

  const handleFiles = useCallback(async (fileList: FileList) => {
    // Validate files first
    const filesArray = Array.from(fileList);
    const invalidFiles = filesArray.filter(
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

    // Create temp files with object URLs for immediate display
    const currentFiles = form.getValues("files") ?? [];
    const tempFiles = filesArray.map(file => ({
      id: null,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      file_url: URL.createObjectURL(file),
      assignment_id: assignmentId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_process_documentation: false // Explicitly mark as not process documentation
    }));

    // Update UI immediately (optimistic)
    const newFiles = [...currentFiles, ...tempFiles];
    form.setValue("files", newFiles, { 
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true 
    });
    await form.trigger("files");
    
    try {
      // Make API calls in background
      const studentId = form.getValues("student_id");
      const uploadPromises = filesArray.map(file => 
        uploadAssignmentFile(file, assignmentId, studentId, { is_process_documentation: false })
      );
      const uploadedFiles = await Promise.all(uploadPromises);
      
      // Replace temp file entries with server responses
      const finalFiles = [...currentFiles];
      uploadedFiles.forEach((uploadedFile, index) => {
        if (uploadedFile) {
          finalFiles.push(uploadedFile);
        }
      });
      
      // Clean up object URLs to prevent memory leaks
      tempFiles.forEach(file => {
        if (typeof file.file_url === 'string' && file.file_url.startsWith('blob:')) {
          URL.revokeObjectURL(file.file_url);
        }
      });
      
      form.setValue("files", finalFiles, { 
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true 
      });
      await form.trigger("files");
      
      toast({
        title: "Success",
        description: "Files uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading files:", error);
      
      // Clean up object URLs on error too
      tempFiles.forEach(file => {
        if (typeof file.file_url === 'string' && file.file_url.startsWith('blob:')) {
          URL.revokeObjectURL(file.file_url);
        }
      });
      
      // Revert to previous state
      form.setValue("files", currentFiles, { 
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true 
      });
      await form.trigger("files");
      
      toast({
        title: "Upload failed",
        description: "There was an error uploading your files. Please try again.",
        variant: "destructive",
      });
    }
  }, [form, assignmentId, toast]);

  const handleDeleteFile = useCallback(async (file: AssignmentFile, index: number) => {
    // Only attempt API delete if file has an ID
    const hasFileId = Boolean(file.id);
    
    // Store current state for potential rollback
    const currentFiles = form.getValues("files") ?? [];
    const fileToDelete = {...currentFiles[index]};
    
    // Update UI immediately
    const newFiles = [...currentFiles];
    newFiles.splice(index, 1);
    form.setValue("files", newFiles, { 
      shouldValidate: true,
      shouldDirty: true 
    });
    await form.trigger("files");
    
    // If no file ID, no need for server operation
    if (!hasFileId) return;
    
    try {
      await deleteFile(file.id!);
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      
      // Restore file to UI on error
      const revertFiles = [...newFiles];
      revertFiles.splice(index, 0, fileToDelete);
      form.setValue("files", revertFiles, {
        shouldValidate: true,
        shouldDirty: true
      });
      await form.trigger("files");
      
      toast({
        title: "Error",
        description: "Failed to delete file. Please try again.",
        variant: "destructive",
      });
    }
  }, [form, toast]);

  const handleYoutubeUrl = useCallback(async (url: string) => {
    // Trim the URL to prevent common issues
    const trimmedUrl = url.trim();
    
    // Client-side validation
    if (!isYouTubeUrl(trimmedUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL.",
        variant: "destructive",
      });
      return false;
    }

    const videoId = getVideoId(trimmedUrl);
    if (!videoId) {
      toast({
        title: "Invalid URL",
        description: "Could not extract YouTube video ID.",
        variant: "destructive",
      });
      return false;
    }
    
    // Set up temporary placeholder and position tracking
    const currentLinks = form.getValues("youtubelinks") ?? [];
    const newLinks = [...currentLinks];
    const emptyIndex = newLinks.findIndex(link => !link.url);
    const position = emptyIndex !== -1 ? emptyIndex : newLinks.length;
    
    // Add placeholder for immediate UI update
    if (emptyIndex !== -1) {
      newLinks[position] = { url: trimmedUrl, title: "Loading video title..." };
    } else {
      newLinks.push({ url: trimmedUrl, title: "Loading video title..." });
    }
    
    // Update UI immediately
    form.setValue("youtubelinks", newLinks, { 
      shouldValidate: true,
      shouldDirty: true 
    });
    await form.trigger("youtubelinks");
    
    try {
      // Fetch video metadata
      const title = await fetchYouTubeVideoTitle(videoId);
      if (!title) throw new Error("Could not fetch video title");
      
      // Update with real data
      const updatedLinks = [...newLinks];
      updatedLinks[position] = { url: trimmedUrl, title };
      
      form.setValue("youtubelinks", updatedLinks, { 
        shouldValidate: true,
        shouldDirty: true 
      });
      await form.trigger("youtubelinks");
      
      toast({
        title: "Success",
        description: "YouTube video added successfully",
      });
      return true;
    } catch (error) {
      console.error("Error fetching YouTube data:", error);
      
      // Rollback on failure
      const rollbackLinks = [...currentLinks];
      
      form.setValue("youtubelinks", rollbackLinks, { 
        shouldValidate: true,
        shouldDirty: true
      });
      await form.trigger("youtubelinks");
      
      toast({
        title: "Invalid URL",
        description: error instanceof Error ? error.message : "Could not process YouTube URL.",
        variant: "destructive",
      });
      return false;
    }
  }, [form, toast]);

  return (
    <div className="space-y-6 md:space-y-8">
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
        name="subject"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium text-gray-900">
              What subject is this for? <span className="text-red-500">*</span>
            </FormLabel>
            <FormDescription className="text-sm text-gray-600">
              Select the subject that this work is related to.
            </FormDescription>
            <SubjectSelect 
              gradeSubjects={gradeSubjects} 
              userGrade={grade ?? ""} 
              field={field} 
            />
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="month"
        render={({ field }) => (
          <FormItem className="max-w-max">
            <FormLabel className="text-base font-medium text-gray-900">
              When did you complete this? <span className="text-red-500">*</span>
            </FormLabel>
            <FormDescription className="text-sm text-gray-600">
              Select the date when you completed this work.
            </FormDescription>
            <DatePicker 
              value={field.value ? 
                (typeof field.value === 'string' && 
                 MONTHS.some(month => month === field.value) ? 
                  new Date(new Date().getFullYear(), MONTHS.findIndex(month => month === field.value), 1) : 
                  new Date(field.value)
                ) : 
                undefined
              } 
              onChange={(date) => {
                form.setValue("month", date?.toISOString(), {
                  shouldValidate: true
                });
              }}
            />
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="files"
        render={() => (
          <FormItem>
            <FormLabel className="text-base font-medium text-gray-900">
              Upload your work <span className="text-red-500">*</span>
            </FormLabel>
            <FormDescription className="text-sm text-gray-600">
              Upload files or add YouTube links to your work (at least one is required)
            </FormDescription>
            
            <FileUploadSection 
              files={form.watch("files")?.map(file => ({
                ...file,
                file_url: file.file_url || "",
                file_name: file.file_name || "",
                file_type: file.file_type || "",
                file_size: file.file_size || 0
              })) ?? []}
              youtubeLinks={form.watch("youtubelinks") ?? []}
              handleFiles={handleFiles}
              handleYoutubeUrl={handleYoutubeUrl}
              isMobile={isMobile}
            />

            {(form.watch("files")?.length > 0 || form.watch("youtubelinks")?.some(link => link.url)) && (
              <YoutubeLinksSection 
                files={form.watch("files")?.map(file => ({
                  ...file,
                  file_url: file.file_url || "",
                  file_name: file.file_name || "",
                  file_type: file.file_type || "",
                  file_size: file.file_size || 0
                })) ?? []}
                youtubeLinks={form.watch("youtubelinks") ?? []}
                handleDeleteFile={handleDeleteFile}
                form={form}
                FileIcon={FileIcon}
                isMobile={isMobile}
              />
            )}
            
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
} 

// Memoized Subject Select component
const SubjectSelect = memo(({ 
  gradeSubjects, 
  userGrade, 
  field 
}: { 
  gradeSubjects: string[], 
  userGrade: string, 
  field: {
    onChange: (value: string) => void;
    value: string;
  }
}) => (
  <Select
    onValueChange={field.onChange}
    value={field.value}
    defaultValue={field.value}
  >
    <FormControl>
      <SelectTrigger className="mt-2">
        <SelectValue placeholder="Select Subject" className="text-muted-foreground" />
      </SelectTrigger>
    </FormControl>
    <SelectContent>
      {gradeSubjects.length > 0 ? (
        gradeSubjects.map((subject) => (
          <SelectItem key={subject} value={subject}>
            {subject}
          </SelectItem>
        ))
      ) : (
        <SelectItem value="no_subject_available" disabled>
          {userGrade ? "No subjects available for your grade" : "Please set your grade in profile settings"}
        </SelectItem>
      )}
    </SelectContent>
  </Select>
));

SubjectSelect.displayName = "SubjectSelect";