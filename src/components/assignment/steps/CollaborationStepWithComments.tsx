import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFormValues } from "@/lib/validations/assignment";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/RichTextEditor";
import { cn } from "@/lib/utils";
import { FormFieldWithComment } from "@/components/ui/form-field-with-comment";
import { useQuestionCommentsContext } from "@/components/teacher/assignment_view/step-component/work";

// Define field names for type safety
type ToggleFieldName = "is_team_work" | "is_original_work";
type TextareaFieldName = "team_contribution" | "originality_explanation";

interface CollaborationStepWithCommentsProps {
  form: UseFormReturn<AssignmentFormValues>;
  isTeacherView?: boolean;
}

interface ToggleFieldProps {
  form: UseFormReturn<AssignmentFormValues>;
  name: ToggleFieldName;
  label: string;
  description: string;
  isTeacherView?: boolean;
}

interface ConditionalTextareaProps {
  form: UseFormReturn<AssignmentFormValues>;
  toggleName: ToggleFieldName;
  textareaName: TextareaFieldName;
  label: string;
  placeholder: string;
  isTeacherView?: boolean;
}

/**
 * Custom switch field with 'Yes/No' labels below the switch and distinct color for selected option
 * Responsive layout: stacked on mobile, side-by-side on desktop
 */
function ToggleFieldWithComments({ form, name, label, description, isTeacherView = false }: ToggleFieldProps) {
  const questionComments = isTeacherView ? useQuestionCommentsContext() : null;
  
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormFieldWithComment
            questionId={name}
            label={label}
            existingComment={questionComments?.getComment(name)}
            onCommentSave={questionComments?.addComment || (() => {})}
            onCommentDelete={questionComments?.removeComment}
            showCommentWidget={isTeacherView}
            disabled={!isTeacherView}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border p-3 sm:p-4">
              <div className="space-y-0.5 mb-2 sm:mb-0">
                <FormDescription className="text-base">{description}</FormDescription>
              </div>
              <FormControl>
                <div className="flex gap-2.5">
                  {/* No Button */}
                  <button
                    type="button"
                    onClick={() => !isTeacherView && field.onChange(false)}
                    disabled={isTeacherView}
                    className={cn(
                      "text-base px-3 py-1 rounded-md transition-colors",
                      !field.value ? "font-bold text-slate-900 bg-slate-100" : "text-slate-500 hover:text-slate-900",
                      isTeacherView && "cursor-not-allowed opacity-75"
                    )}
                  >
                    No
                  </button>

                  {/* Yes Button */}
                  <button
                    type="button"
                    onClick={() => !isTeacherView && field.onChange(true)}
                    disabled={isTeacherView}
                    className={cn(
                      "text-base px-3 py-1 rounded-md transition-colors",
                      field.value ? "font-bold text-slate-900 bg-slate-100" : "text-slate-500 hover:text-slate-900",
                      isTeacherView && "cursor-not-allowed opacity-75"
                    )}
                  >
                    Yes
                  </button>
                </div>
              </FormControl>
            </div>
          </FormFieldWithComment>
        </FormItem>
      )}
    />
  );
}

/**
 * Conditional textarea that only appears when the toggle is 'Yes'
 * Adapts height based on viewport size
 */
function ConditionalTextareaWithComments({ 
  form, 
  toggleName, 
  textareaName, 
  label, 
  placeholder, 
  isTeacherView = false 
}: ConditionalTextareaProps) {
  const questionComments = isTeacherView ? useQuestionCommentsContext() : null;
  
  if (!form.watch(toggleName)) return null;
  
  return (
    <FormField
      control={form.control}
      name={textareaName}
      render={({ field }) => (
        <FormItem className="pb-1 sm:pb-2">
          <FormFieldWithComment
            questionId={textareaName}
            label={label}
            existingComment={questionComments?.getComment(textareaName)}
            onCommentSave={questionComments?.addComment || (() => {})}
            onCommentDelete={questionComments?.removeComment}
            showCommentWidget={isTeacherView}
            disabled={!isTeacherView}
          >
            <FormControl>
              <RichTextEditor
                value={field.value || ""}
                onChange={isTeacherView ? () => {} : field.onChange}
                placeholder={placeholder}
              />
            </FormControl>
            <FormMessage />
          </FormFieldWithComment>
        </FormItem>
      )}
    />
  );
}

/**
 * CollaborationStepWithComments component for gathering information about teamwork and originality
 * Features a responsive layout and conditional form fields with teacher commenting support
 */
export function CollaborationStepWithComments({ form, isTeacherView = false }: CollaborationStepWithCommentsProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <ToggleFieldWithComments 
        form={form}
        name="is_team_work"
        label="Team Project"
        description="Is this a team project"
        isTeacherView={isTeacherView}
      />
      
      <ConditionalTextareaWithComments
        form={form}
        toggleName="is_team_work"
        textareaName="team_contribution"
        label="Describe your role and experience"
        placeholder="What was your specific contribution to the team project?"
        isTeacherView={isTeacherView}
      />
      
      <ToggleFieldWithComments 
        form={form}
        name="is_original_work"
        label="Original Work"
        description="Did you create something new or original?"
        isTeacherView={isTeacherView}
      />
      
      <ConditionalTextareaWithComments
        form={form}
        toggleName="is_original_work"
        textareaName="originality_explanation"
        label="Explain what was new"
        placeholder="What aspects of your work were original or innovative?"
        isTeacherView={isTeacherView}
      />
    </div>
  );
} 