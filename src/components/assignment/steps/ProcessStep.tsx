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
import { Textarea } from "@/components/ui/textarea";
import { SKILLS } from "@/constants";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface ProcessStepProps {
  form: UseFormReturn<AssignmentFormValues>;
}

export function ProcessStep({ form }: ProcessStepProps) {
  // Enforce character limit on text input
  const enforceCharacterLimit = (
    e: React.ChangeEvent<HTMLTextAreaElement>, 
    onChange: (value: string) => void
  ) => {
    const value = e.target.value;
    if (value.length <= 200) {
      onChange(value);
    } else {
      // Trim to 200 characters if it exceeds
      onChange(value.slice(0, 200));
    }
  };

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="selected_skills"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium">
              What skills did you practice? (Select Top 3) <span className="text-red-500">*</span>
            </FormLabel>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3">
              {SKILLS.slice(0, 5).map((skill) => (
                <div key={skill.id} className="flex items-center space-x-2">
                  <Checkbox
                    checked={field.value?.includes(skill.id)}
                    onCheckedChange={(checked) => {
                      const newValue = checked
                        ? [...(field.value || []), skill.id].slice(0, 3)
                        : field.value?.filter((id) => id !== skill.id) || [];
                      field.onChange(newValue);
                    }}
                    id={`skill-${skill.id}`}
                  />
                  <label
                    htmlFor={`skill-${skill.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {skill.name}
                  </label>
                </div>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="skills_justification"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium">
              Justify the selected skills <span className="text-red-500">*</span>
            </FormLabel>
            <FormDescription>
              How did each skill contribute to the creation of the artifact?
              What actions, decisions, or moments during the process
              demonstrated these skills?
            </FormDescription>
            <FormControl>
              <Textarea
                placeholder="How did each skill help you in creating this artifact?"
                className="min-h-[100px]"
                value={field.value || ""}
                onChange={(e) => enforceCharacterLimit(e, field.onChange)}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                required
              />
            </FormControl>
            <div className="flex justify-end text-xs text-gray-500 mt-1">
              {field.value?.length || 0}/200 max
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

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
              <Textarea
                placeholder="What makes this work special or meaningful to you?"
                className="min-h-[100px]"
                value={field.value || ""}
                onChange={(e) => enforceCharacterLimit(e, field.onChange)}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                required
              />
            </FormControl>
            <div className="flex justify-end text-xs text-gray-500 mt-1">
              {field.value?.length || 0}/200 max
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
