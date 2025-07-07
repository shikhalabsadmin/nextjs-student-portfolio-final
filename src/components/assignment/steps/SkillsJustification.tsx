import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { CharacterLimitedTextarea } from "@/components/ui/character-limited-textarea";
import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFormValues } from "@/lib/validations/assignment";

interface SkillsJustificationProps {
  form: UseFormReturn<AssignmentFormValues>;
}

export function SkillsJustification({ form }: SkillsJustificationProps) {
  return (
    <FormField
      control={form.control}
      name="skills_justification"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-base font-medium">
            Justify the selected skills <span className="text-red-500">*</span>
          </FormLabel>
          <FormDescription>
            How did each skill contribute to the creation of the work?
            What actions, decisions, or moments during the process
            demonstrated these skills?
          </FormDescription>
          <FormControl>
            <CharacterLimitedTextarea
              placeholder="How did each skill help you in creating this work?"
              value={field.value || ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
              required
              currentLength={field.value?.length || 0}
              maxLength={2000}
              suggestedLength={200}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
} 