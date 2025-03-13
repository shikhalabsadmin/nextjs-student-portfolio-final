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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProcessStepProps {
  form: UseFormReturn<AssignmentFormValues>;
}

export function ProcessStep({ form }: ProcessStepProps) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="selected_skills"
        render={({ field }) => (
          <FormItem>
            <FormLabel>What skills did you practice? Select Top 3</FormLabel>
            <FormDescription>
              Choose up to three skills that best represent your work
            </FormDescription>
            <div className="flex flex-wrap gap-2 mt-3">
              {SKILLS.map((skill) => (
                <Badge
                  key={skill.id}
                  variant="outline"
                  className={cn(
                    "cursor-pointer hover:bg-[#62C59F]/5 transition-colors",
                    field.value?.includes(skill.id)
                      ? "bg-[#62C59F]/10 text-[#62C59F] border-[#62C59F]"
                      : "bg-transparent"
                  )}
                  onClick={() => {
                    const newValue = field.value?.includes(skill.id)
                      ? field.value.filter((id) => id !== skill.id)
                      : [...(field.value || []), skill.id].slice(0, 3);
                    field.onChange(newValue);
                  }}
                >
                  {skill.name}
                </Badge>
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
            <FormLabel>Justify the selected skills</FormLabel>
            <FormControl>
              <Textarea
                placeholder="How did you demonstrate these skills in your work?"
                className="min-h-[100px]"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="pride_reason"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Why are you proud of this artifact?</FormLabel>
            <FormControl>
              <Textarea
                placeholder="What makes this work special to you?"
                className="min-h-[100px]"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="creation_process"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Describe the process you used to create it</FormLabel>
            <FormControl>
              <Textarea
                placeholder="What steps did you take to complete this work?"
                className="min-h-[100px]"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
} 