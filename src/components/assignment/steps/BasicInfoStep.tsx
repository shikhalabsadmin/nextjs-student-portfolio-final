import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFormValues, ExternalLink } from "@/lib/validations/assignment";
import type { AssignmentFile } from "@/types/file";
import { MONTHS } from "@/constants/months";
import { useMemo, useCallback, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useExternalLinks } from "@/hooks/useExternalLinks";
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
import { FileUploadSection, ExternalLinksSection } from "./file-upload";
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
  
  const getExternalLinks = useCallback(() => {
    // Check for externalLinks first (new format)
    const externalLinks = form.getValues("externalLinks");
    if (Array.isArray(externalLinks) && externalLinks.length > 0) {
      return externalLinks;
    }
    
    // Fallback to youtubelinks if no externalLinks (for backward compatibility)
    const youtubeLinks = form.getValues("youtubelinks") ?? [];
    return youtubeLinks.map(link => ({
      ...link,
      type: 'youtube' // Ensure type is set for YouTube links
    }));
  }, [form]);
  
  const setFiles = useCallback(async (files: AssignmentFile[], isTemporary?: boolean) => {
    form.setValue("files", files, { 
      shouldValidate: true, // Always validate to update button state
      shouldDirty: true,
      shouldTouch: true
    });
    await form.trigger("files");
    // Force a re-evaluation of form state
    await form.trigger();
  }, [form]);

  const setExternalLinks = useCallback(async (links: ExternalLink[]) => {
    // Set both fields for backward compatibility
    form.setValue("externalLinks", links, { 
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
    
    // Also update youtubelinks for backward compatibility
    // Only include links that are YouTube links
    const youtubeLinks = links.filter(link => link.type === 'youtube')
      .map(link => ({
        url: link.url,
        title: link.title
      }));
    
    form.setValue("youtubelinks", youtubeLinks, { 
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
    
    await form.trigger("externalLinks");
    await form.trigger("youtubelinks");
    // Force a re-evaluation of form state
    await form.trigger();
  }, [form]);
  
  // Migrate old youtubelinks data to externalLinks format on component mount
  useEffect(() => {
    const youtubeLinks = form.getValues("youtubelinks");
    const externalLinks = form.getValues("externalLinks");
    
    // If we have youtubelinks but no externalLinks, migrate the data
    if (Array.isArray(youtubeLinks) && youtubeLinks.length > 0 && 
        (!Array.isArray(externalLinks) || externalLinks.length === 0)) {
      
      const newExternalLinks = youtubeLinks.map(link => ({
        ...link,
        type: 'youtube'
      }));
      
      // Only update if we have valid links to migrate
      if (newExternalLinks.some(link => link.url)) {
        form.setValue("externalLinks", newExternalLinks, {
          shouldValidate: false,
          shouldDirty: false,
          shouldTouch: false
        });
      }
    }
  }, [form]);

  // Use custom hooks with adapters
  const { handleFiles } = useFileUpload({
    getFiles,
    setFiles,
    assignmentId,
    studentId: form.getValues("student_id"),
  });
  
  const { handleExternalUrl } = useExternalLinks({
    getLinks: getExternalLinks,
    setLinks: setExternalLinks
  });
  
  const { handleDeleteFile } = useFileManagement({
    getFiles,
    setFiles
  });

  // Cleanup phantom empty external links on component mount
  useEffect(() => {
    const externalLinks = form.getValues("externalLinks") || [];
    const hasEmptyLinks = externalLinks.some(link => !link?.url || !link.url.trim());
    
    if (hasEmptyLinks) {
      // Filter out empty links
      const cleanLinks = externalLinks.filter(link => link?.url && link.url.trim());
      
      // Update form
      form.setValue("externalLinks", cleanLinks, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
      
      // Update youtubelinks to match
      const youtubeLinks = cleanLinks
        .filter(link => link.type === 'youtube')
        .map(link => ({ url: link.url, title: link.title }));
        
      form.setValue("youtubelinks", youtubeLinks, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
      
      // Trigger validation
      form.trigger();
    }
  }, [form]);



  return (
    <div className="space-y-6 md:space-y-8">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-lg font-medium text-gray-900">
              What is the name of your work? <span className="text-red-500">*</span>
            </FormLabel>
            <FormDescription className="text-base text-gray-600">
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
            <FormLabel className="text-lg font-medium text-gray-900">
              What type of work is this? <span className="text-red-500">*</span>
            </FormLabel>
            <FormDescription className="text-base text-gray-600">
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
            <FormLabel className="text-lg font-medium text-gray-900">
              What subject is this for? <span className="text-red-500">*</span>
            </FormLabel>
            <FormDescription className="text-base text-gray-600">
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
            <FormLabel className="text-lg font-medium text-gray-900">
              When did you complete this? <span className="text-red-500">*</span>
            </FormLabel>
            <FormDescription className="text-base text-gray-600">
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
            <FormLabel className="text-lg font-medium text-gray-900">
              Upload your work <span className="text-red-500">*</span>
            </FormLabel>
            <FormDescription className="text-lg text-gray-600">
              <strong>Upload files, add links, or both</strong> to continue to the next step. You must provide at least one item.
            </FormDescription>
            
            <FileUploadSection 
              files={form.watch("files")?.map(file => ({
                ...file,
                file_url: file.file_url || "",
                file_name: file.file_name || "",
                file_type: file.file_type || "",
                file_size: file.file_size || 0
              })) ?? []}
              externalLinks={form.watch("externalLinks") ?? []}
              handleFiles={handleFiles}
              handleExternalUrl={handleExternalUrl}
              isMobile={isMobile}
            />

            {(form.watch("files")?.length > 0 || form.watch("externalLinks")?.some(link => link.url)) && (
              <ExternalLinksSection 
                files={form.watch("files")?.map(file => ({
                  ...file,
                  file_url: file.file_url || "",
                  file_name: file.file_name || "",
                  file_type: file.file_type || "",
                  file_size: file.file_size || 0
                })) ?? []}
                externalLinks={form.watch("externalLinks") ?? []}
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