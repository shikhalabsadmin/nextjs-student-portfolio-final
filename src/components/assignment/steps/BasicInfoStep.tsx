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

      const studentId = form.getValues("student_id");
      const uploadedFiles = await Promise.all(
        Array.from(fileList).map(file => uploadAssignmentFile(file, assignmentId, studentId))
      );
      
      const currentFiles = form.getValues("files") ?? [];
      form.setValue("files", [...currentFiles, ...uploadedFiles], { 
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true 
      });
      
      // Trigger form update explicitly
      await form.trigger("files");
      
      toast({
        title: "Success",
        description: "Files uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading files:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your files.",
        variant: "destructive",
      });
    }
  }, [form, assignmentId, toast]);

  const handleDeleteFile = useCallback(async (file: AssignmentFile, index: number) => {
    try {
      if (file.id) {
        await deleteFile(file.id);
      }
      const currentFiles = form.getValues("files") ?? [];
      const newFiles = [...currentFiles];
      newFiles.splice(index, 1);
      form.setValue("files", newFiles, { 
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true 
      });
      
      // Trigger form update explicitly
      await form.trigger("files");
      
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
  }, [form, toast]);

  const handleYoutubeUrl = useCallback(async (url: string) => {
    try {
      if (!isYouTubeUrl(url)) {
        throw new Error("Please enter a valid YouTube URL");
      }

      const videoId = getVideoId(url);
      if (!videoId) {
        throw new Error("Invalid YouTube URL");
      }

      const title = await fetchYouTubeVideoTitle(videoId);
      if (!title) {
        throw new Error("Could not fetch video title");
      }

      const currentLinks = form.getValues("youtubelinks") ?? [];
      const newYoutubeLinks = [...currentLinks];
      const emptyIndex = newYoutubeLinks.findIndex(link => !link.url);
      
      if (emptyIndex !== -1) {
        newYoutubeLinks[emptyIndex] = { url, title };
      } else {
        newYoutubeLinks.push({ url, title });
      }

      form.setValue("youtubelinks", newYoutubeLinks, { 
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true 
      });
      
      // Trigger form update explicitly
      await form.trigger("youtubelinks");
      
      toast({
        title: "Success",
        description: "YouTube video added successfully",
      });
      return true;
    } catch (error) {
      toast({
        title: "Invalid URL",
        description: error instanceof Error ? error.message : "Please enter a valid YouTube URL.",
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
          <FormItem>
            <FormLabel className="text-base font-medium text-gray-900">
              When did you complete this? <span className="text-red-500">*</span>
            </FormLabel>
            <FormDescription className="text-sm text-gray-600">
              Select the month in which you worked on this artifact.
            </FormDescription>
            <MonthSelect field={field} />
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

// Memoized Month Select component
const MonthSelect = memo(({ field }: { 
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
        <SelectValue placeholder="Select Month" className="text-muted-foreground" />
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
));

MonthSelect.displayName = "MonthSelect";