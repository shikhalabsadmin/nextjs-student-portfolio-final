import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { CharacterLimitedTextarea } from "@/components/ui/character-limited-textarea";
import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFormValues } from "@/lib/validations/assignment";

interface ReflectionFieldProps {
  form: UseFormReturn<AssignmentFormValues>;
  name: keyof AssignmentFormValues;
  label: string;
  description: string;
  placeholder: string;
  currentLength: number;
}

export function ReflectionField({
  form,
  name,
  label,
  description,
  placeholder,
  currentLength,
}: ReflectionFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-lg font-medium">
            {label} <span className="text-red-500">*</span>
          </FormLabel>
          <FormDescription>{description}</FormDescription>
          <FormControl>
            <CharacterLimitedTextarea
              placeholder={placeholder}
              value={(field.value as string) || ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
              required
              currentLength={currentLength}
              maxLength={2000}
              suggestedLength={1500}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
} 