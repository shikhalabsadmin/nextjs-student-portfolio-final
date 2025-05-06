import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFormValues } from "@/lib/validations/assignment";
import type { AssignmentFile } from "@/types/file";
import { MONTHS } from "@/constants/months";
import { useMemo, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useYoutubeLinks } from "@/hooks/useYoutubeLinks";
import { useFileManagement } from "@/hooks/useFileManagement";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { FileUploadSection, YoutubeLinksSection } from "./file-upload";
import { GRADE_SUBJECTS, GradeLevel } from "@/constants/grade-subjects";
import { DatePicker } from "@/components/ui/date-picker";
import { ValidatedSelect } from "@/components/ui/validated-select";

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

  // Convert subjects to the format needed by ValidatedSelect
  const subjectOptions = useMemo(() => 
    gradeSubjects.map(subject => ({
      value: subject,
      label: subject
    }))
  , [gradeSubjects]);

  // Adapter functions to make form-specific logic compatible with our generic hooks
  const getFiles = useCallback(() => {
    const files = form.getValues("files") ?? [];
    // Add type assertion to ensure file required properties are met
    return files.map(file => ({
      ...file,
      file_url: file.file_url || "",
      file_name: file.file_name || "",
      file_type: file.file_type || "",
      file_size: file.file_size || 0
    })) as AssignmentFile[];
  }, [form]);
  
  const getYoutubeLinks = useCallback(() => form.getValues("youtubelinks") ?? [], [form]);
  
  const setFiles = useCallback(async (files: AssignmentFile[], isTemporary?: boolean) => {
    form.setValue("files", files, { 
      shouldValidate: !isTemporary,
      shouldDirty: true,
      shouldTouch: !isTemporary
    });
    if (!isTemporary) {
      await form.trigger("files");
    }
  }, [form]);

  const setYoutubeLinks = useCallback(async (links: Array<{url?: string; title?: string}>) => {
    form.setValue("youtubelinks", links, { 
      shouldValidate: true,
      shouldDirty: true 
    });
    await form.trigger("youtubelinks");
  }, [form]);

  // Use custom hooks with adapters
  const { handleFiles } = useFileUpload({
    getFiles,
    setFiles,
    assignmentId,
    studentId: form.getValues("student_id"),
      });
  
  const { handleYoutubeUrl } = useYoutubeLinks({
    getLinks: getYoutubeLinks,
    setLinks: setYoutubeLinks
  });
  
  const { handleDeleteFile } = useFileManagement({
    getFiles,
    setFiles
  });

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
              Give your work name a meaningful title that represents your work.
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
              Work type refers to whether the work is a project, essay, model, performance, presentation, or another specific format.
            </FormDescription>
            <FormControl>
              <Input
                placeholder='Example: "This work is a essay"'
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
            <ValidatedSelect
              field={field}
              form={form}
              items={subjectOptions}
              placeholder="Select Subject"
              styles={{
                selectTrigger: "mt-2"
              }}
              emptyMessage={grade ? "No subjects available for your grade" : "Please set your grade in profile settings"}
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