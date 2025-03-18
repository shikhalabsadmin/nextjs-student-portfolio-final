import { Checkbox } from "@/components/ui/checkbox";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SKILLS } from "@/constants";
import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFormValues } from "@/lib/validations/assignment";

interface SkillsSelectionProps {
  form: UseFormReturn<AssignmentFormValues>;
}

export function SkillsSelection({ form }: SkillsSelectionProps) {
  return (
    <FormField
      control={form.control}
      name="selected_skills"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-base font-medium">
            What skills did you practice? (Select Top 3) <span className="text-red-500">*</span>
          </FormLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-3">
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
  );
} 