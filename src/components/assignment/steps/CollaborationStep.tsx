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
import { cn } from "@/lib/utils"; // Assuming cn is available for className merging

// Define field names for type safety
type ToggleFieldName = "is_team_work" | "is_original_work";
type TextareaFieldName = "team_contribution" | "originality_explanation";

interface CollaborationStepProps {
  form: UseFormReturn<AssignmentFormValues>;
}

interface ToggleFieldProps {
  form: UseFormReturn<AssignmentFormValues>;
  name: ToggleFieldName;
  label: string;
  description: string;
}

interface ConditionalTextareaProps {
  form: UseFormReturn<AssignmentFormValues>;
  toggleName: ToggleFieldName;
  textareaName: TextareaFieldName;
  label: string;
  placeholder: string;
}

/**
 * Custom switch field with 'Yes/No' labels below the switch and distinct color for selected option
 * Responsive layout: stacked on mobile, side-by-side on desktop
 */
function ToggleField({ form, name, label, description }: ToggleFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border p-3 sm:p-4">
          <div className="space-y-0.5 mb-2 sm:mb-0">
            <FormLabel className="text-lg">{label}</FormLabel>
            <FormDescription className="text-base">{description}</FormDescription>
          </div>
          <FormControl>
            <div className="flex gap-2.5">
              {/* No Button */}
              <button
                type="button"
                onClick={() => field.onChange(false)}
                className={cn(
                  "text-base px-3 py-1 rounded-md transition-colors",
                  !field.value ? "font-bold text-slate-900 bg-slate-100" : "text-slate-500 hover:text-slate-900"
                )}
              >
                No
              </button>

              {/* Yes Button */}
              <button
                type="button"
                onClick={() => field.onChange(true)}
                className={cn(
                  "text-base px-3 py-1 rounded-md transition-colors",
                  field.value ? "font-bold text-slate-900 bg-slate-100" : "text-slate-500 hover:text-slate-900"
                )}
              >
                Yes
              </button>
            </div>
          </FormControl>
        </FormItem>
      )}
    />
  );
}


/**
 * Conditional textarea that only appears when the toggle is 'Yes'
 * Adapts height based on viewport size
 */
function ConditionalTextarea({ form, toggleName, textareaName, label, placeholder }: ConditionalTextareaProps) {
  if (!form.watch(toggleName)) return null;
  
  return (
    <FormField
      control={form.control}
      name={textareaName}
      render={({ field }) => (
        <FormItem className="pb-1 sm:pb-2">
          <FormLabel className="text-lg">{label}</FormLabel>
          <FormControl>
            <RichTextEditor
              value={field.value || ""}
              onChange={field.onChange}
              placeholder={placeholder}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/**
 * CollaborationStep component for gathering information about teamwork and originality
 * Features a responsive layout and conditional form fields
 */
export function CollaborationStep({ form }: CollaborationStepProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <ToggleField 
        form={form}
        name="is_team_work"
        label="Team Project"
        description="Is this a team project"
      />
      
      <ConditionalTextarea
        form={form}
        toggleName="is_team_work"
        textareaName="team_contribution"
        label="Describe your role and experience"
        placeholder="What was your specific contribution to the team project?"
      />
      
      <ToggleField 
        form={form}
        name="is_original_work"
        label="Original Work"
        description="Did you create something new or original?"
      />
      
      <ConditionalTextarea
        form={form}
        toggleName="is_original_work"
        textareaName="originality_explanation"
        label="Explain what was new"
        placeholder="What aspects of your work were original or innovative?"
      />
    </div>
  );
}