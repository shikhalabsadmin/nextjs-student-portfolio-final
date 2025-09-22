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
import { GRADE_SUBJECTS, GRADE_LEVELS, GradeLevel } from "@/constants/grade-subjects";
import { DatePicker } from "@/components/ui/date-picker";
import { ValidatedSelect } from "@/components/ui/validated-select";
import { FormFieldWithComment } from "@/components/ui/form-field-with-comment";
import { useQuestionCommentsContext } from "@/components/teacher/assignment_view/step-component/work";

interface BasicInfoStepWithCommentsProps {
  form: UseFormReturn<AssignmentFormValues>;
  isTeacherView?: boolean;
}

// Question ID to readable name mapping
const QUESTION_LABELS = {
  title: "Assignment Title",
  artifact_type: "Type of Work",
  subject: "Subject Selection", 
  month: "Completion Date",
  files: "Files and Links Upload"
};

export function BasicInfoStepWithComments({ form, isTeacherView = false }: BasicInfoStepWithCommentsProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const assignmentId = form.getValues("id") ?? "";
  const grade = form.watch("grade") ?? "";
  
  // Get question comments context (only available in teacher view)
  const questionComments = isTeacherView ? useQuestionCommentsContext() : null;
  
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

  // Adapter functions (same as original BasicInfoStep)
  const getFiles = useCallback(() => {
    const files = form.getValues("files") ?? [];
    return files.map(file => ({
      ...file,
      file_url: file.file_url || "",
      file_name: file.file_name || "",
      file_type: file.file_type || "",
      file_size: file.file_size || 0
    })) as AssignmentFile[];
  }, [form]);
  
  const getExternalLinks = useCallback(() => {
    const externalLinks = form.getValues("externalLinks");
    if (Array.isArray(externalLinks) && externalLinks.length > 0) {
      return externalLinks;
    }
    
    const youtubeLinks = form.getValues("youtubelinks") ?? [];
    return youtubeLinks.map(link => ({
      ...link,
      type: 'youtube'
    }));
  }, [form]);
  
  const setFiles = useCallback(async (files: AssignmentFile[], isTemporary?: boolean) => {
    form.setValue("files", files, { 
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
    await form.trigger("files");
    await form.trigger();
  }, [form]);

  const setExternalLinks = useCallback(async (links: ExternalLink[]) => {
    form.setValue("externalLinks", links, { 
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
    
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
    await form.trigger();
  }, [form]);
  
  // Migration logic (same as original)
  useEffect(() => {
    const youtubeLinks = form.getValues("youtubelinks");
    const externalLinks = form.getValues("externalLinks");
    
    if (Array.isArray(youtubeLinks) && youtubeLinks.length > 0 && 
        (!Array.isArray(externalLinks) || externalLinks.length === 0)) {
      
      const newExternalLinks = youtubeLinks.map(link => ({
        ...link,
        type: 'youtube'
      }));
      
      if (newExternalLinks.some(link => link.url)) {
        form.setValue("externalLinks", newExternalLinks, {
          shouldValidate: false,
          shouldDirty: false,
          shouldTouch: false
        });
      }
    }
  }, [form]);

  // Use custom hooks
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



  return (
    <div className="space-y-6 md:space-y-8">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormFieldWithComment
              questionId="title"
              label="What is the name of your work? *"
              existingComment={questionComments?.getComment("title")}
              onCommentSave={questionComments?.addComment || (() => {})}
              onCommentDelete={questionComments?.removeComment}
              showCommentWidget={isTeacherView}
              disabled={!isTeacherView}
            >
              <div>
                <FormDescription className="text-base text-gray-600 mb-2">
                  Give your work name a meaningful title that represents your work.
                </FormDescription>
                <FormControl>
                  <Input
                    placeholder='Example: "Solar System Model"'
                    className="mt-2"
                    {...field}
                    readOnly={isTeacherView}
                  />
                </FormControl>
                <FormMessage />
              </div>
            </FormFieldWithComment>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="artifact_type"
        render={({ field }) => (
          <FormItem>
            <FormFieldWithComment
              questionId="artifact_type"
              label="What type of work is this? *"
              existingComment={questionComments?.getComment("artifact_type")}
              onCommentSave={questionComments?.addComment || (() => {})}
              onCommentDelete={questionComments?.removeComment}
              showCommentWidget={isTeacherView}
              disabled={!isTeacherView}
            >
              <div>
                <FormDescription className="text-base text-gray-600 mb-2">
                  Work type refers to whether the work is a project, essay, model, performance, presentation, or another specific format.
                </FormDescription>
                <FormControl>
                  <Input
                    placeholder='Example: "This work is a essay"'
                    className="mt-2"
                    {...field}
                    readOnly={isTeacherView}
                  />
                </FormControl>
                <FormMessage />
              </div>
            </FormFieldWithComment>
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="subject"
        render={({ field }) => (
          <FormItem>
            <FormFieldWithComment
              questionId="subject"
              label={
                <>
                  What subject is this for? <span className="text-red-500">*</span>
                </>
              }
              existingComment={questionComments?.getComment("subject")}
              onCommentSave={questionComments?.addComment || (() => {})}
              onCommentDelete={questionComments?.removeComment}
              showCommentWidget={isTeacherView}
              disabled={!isTeacherView}
            >
              <div>
                <FormDescription className="text-base text-gray-600 mb-2">
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
                  disabled={isTeacherView}
                />
                <FormMessage />
              </div>
            </FormFieldWithComment>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="month"
        render={({ field }) => (
          <FormItem className="max-w-max">
            <FormFieldWithComment
              questionId="month"
              label={
                <>
                  When did you complete this? <span className="text-red-500">*</span>
                </>
              }
              existingComment={questionComments?.getComment("month")}
              onCommentSave={questionComments?.addComment || (() => {})}
              onCommentDelete={questionComments?.removeComment}
              showCommentWidget={isTeacherView}
              disabled={!isTeacherView}
            >
              <div>
                <FormDescription className="text-base text-gray-600 mb-2">
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
                    if (!isTeacherView) {
                      form.setValue("month", date?.toISOString(), {
                        shouldValidate: true
                      });
                    }
                  }}
                />
                <FormMessage />
              </div>
            </FormFieldWithComment>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="files"
        render={() => (
          <FormItem>
            <FormFieldWithComment
              questionId="files"
              label={
                <>
                  Upload your work <span className="text-red-500">*</span>
                </>
              }
              existingComment={questionComments?.getComment("files")}
              onCommentSave={questionComments?.addComment || (() => {})}
              onCommentDelete={questionComments?.removeComment}
              showCommentWidget={isTeacherView}
              disabled={!isTeacherView}
            >
              <div>
                <FormDescription className="text-lg text-gray-600 mb-2">
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
                  handleFiles={isTeacherView ? async () => {} : handleFiles}
                  handleExternalUrl={isTeacherView ? async () => false : handleExternalUrl}
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
                    handleDeleteFile={isTeacherView ? async () => {} : handleDeleteFile}
                    form={form}
                    FileIcon={FileIcon}
                    isMobile={isMobile}
                  />
                )}
                
                <FormMessage />
              </div>
            </FormFieldWithComment>
          </FormItem>
        )}
      />
    </div>
  );
} 