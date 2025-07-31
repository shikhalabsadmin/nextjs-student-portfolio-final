import { FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { SKILLS } from "@/constants";
import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFormValues } from "@/lib/validations/assignment";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface SkillsSelectionProps {
  form: UseFormReturn<AssignmentFormValues>;
}

export function SkillsSelection({ form }: SkillsSelectionProps) {
  // Prevent validation on initial render
  useEffect(() => {
    // Clear errors for this field on first render to prevent premature validation
    const errors = { ...form.formState.errors };
    if (errors.selected_skills) {
      delete errors.selected_skills;
      // @ts-ignore - Manually setting errors
      form.formState.errors = errors;
    }
  }, []);

  // Check if this field has an error for enhanced styling
  const hasError = !!form.formState.errors.selected_skills;

  return (
    <TooltipProvider>
      <FormField
        control={form.control}
        name="selected_skills"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={cn(
              "text-lg font-medium",
              hasError && "text-red-500"
            )}>
              What skills did you practice? (Select Top 3) <span className="text-red-500">*</span>
            </FormLabel>
            <FormDescription className={cn(
              hasError && "text-red-400"
            )}>
              Choose the most relevant skills you used to create this work.
            </FormDescription>
            <div className={cn(
              "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-3",
              hasError && "ring-2 ring-red-500 rounded-lg p-3 bg-red-50"
            )}>
              {SKILLS.slice(0, 5).map((skill) => (
                <div key={skill.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={skill.id}
                    checked={field.value?.includes(skill.id) || false}
                    onChange={(e) => {
                      const updatedSkills = e.target.checked
                        ? [...(field.value || []), skill.id]
                        : (field.value || []).filter((id: string) => id !== skill.id);
                      field.onChange(updatedSkills);
                      
                      // Clear error when user starts selecting skills
                      if (hasError && updatedSkills.length > 0) {
                        form.clearErrors('selected_skills');
                      }
                    }}
                    className={cn(
                      "rounded text-blue-600 focus:ring-blue-500",
                      hasError && "border-red-500 focus:ring-red-500"
                    )}
                  />
                  <label 
                    htmlFor={skill.id} 
                    className={cn(
                      "text-lg font-medium cursor-pointer",
                      hasError && "text-red-600"
                    )}
                  >
                    {skill.name}
                  </label>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-lg">{skill.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </TooltipProvider>
  );
} 