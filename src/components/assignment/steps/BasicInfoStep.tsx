import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFormValues } from "@/lib/validations/assignment";
import type { AssignmentFile } from "@/types/file";
import { MONTHS } from "@/constants/months";
import { useMemo, memo, useCallback } from "react";
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
import { useBasicInfoStep } from "@/hooks/useBasicInfoStep";
import { useIsMobile } from "@/hooks/use-mobile";
import { FileUploadSection, YoutubeLinksSection } from "./file-upload";
import { GRADE_SUBJECTS, ALL_SUBJECTS, GRADE_LEVELS, GradeLevel } from "@/constants/grade-subjects";

interface BasicInfoStepProps {
  form: UseFormReturn<AssignmentFormValues>;
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

export function BasicInfoStep({ form }: BasicInfoStepProps) {
  // Use a single watch call with array of fields to reduce overhead
  const watchedValues = form.watch(["files", "youtubelinks", "grade"]);
  const files = (watchedValues[0] || []) as AssignmentFile[];
  const youtubelinks = watchedValues[1] || [{ url: "", title: "" }];
  const grade = (watchedValues[2] || "") as string;
  const isMobile = useIsMobile();
  
  // Memoize grade subjects
  const gradeSubjects = useMemo(() => 
    grade 
      ? GRADE_SUBJECTS[grade as GradeLevel] || []
      : []
  , [grade]);
  
  const { 
    handleFiles: originalHandleFiles, 
    handleDeleteFile: originalHandleDeleteFile, 
    handleYoutubeUrl: originalHandleYoutubeUrl, 
    FileIcon 
  } = useBasicInfoStep(form);
  
  // Memoize handlers with useCallback
  const handleFiles = useCallback(originalHandleFiles, [originalHandleFiles]);
  const handleDeleteFile = useCallback(originalHandleDeleteFile, [originalHandleDeleteFile]);
  const handleYoutubeUrl = useCallback(originalHandleYoutubeUrl, [originalHandleYoutubeUrl]);

  // Debug logging
  console.log("gradeSubjects", gradeSubjects);  
  console.log("userGrade", grade);
  console.log("form", form.getValues());

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
              userGrade={grade} 
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
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium text-gray-900">
              Upload your work <span className="text-red-500">*</span>
            </FormLabel>
            <FormDescription className="text-sm text-gray-600">
              Upload files or add YouTube links to your work (at least one is required)
            </FormDescription>
            
            <FileUploadSection 
              files={files}
              youtubeLinks={youtubelinks}
              handleFiles={handleFiles}
              handleYoutubeUrl={handleYoutubeUrl}
              isMobile={isMobile}
            />

            {(files.length > 0 || youtubelinks.some(link => link.url)) && (
              <YoutubeLinksSection 
                files={files}
                youtubeLinks={youtubelinks}
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