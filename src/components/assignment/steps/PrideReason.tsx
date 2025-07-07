import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { CharacterLimitedTextarea } from "@/components/ui/character-limited-textarea";
import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFormValues } from "@/lib/validations/assignment";

interface PrideReasonProps {
  form: UseFormReturn<AssignmentFormValues>;
}

export function PrideReason({ form }: PrideReasonProps) {
  return (
    <FormField
      control={form.control}
      name="pride_reason"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-base font-medium">
            Why are you proud of this artifact? <span className="text-red-500">*</span>
          </FormLabel>
          <FormDescription>
            Did it challenge you in a new way, showcase your creativity, or
            reflect your best effort? Describe the moments that made you feel
            proud.
          </FormDescription>
          <FormControl>
            <CharacterLimitedTextarea
              placeholder="What makes this work special or meaningful to you?"
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