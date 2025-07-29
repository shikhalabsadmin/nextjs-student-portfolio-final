import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { RichCharacterLimitedTextarea } from "@/components/ui/rich-character-limited-textarea";
import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFormValues } from "@/lib/validations/assignment";
import { SKILLS } from "@/constants";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface SkillsJustificationProps {
  form: UseFormReturn<AssignmentFormValues>;
}

export function SkillsJustification({ form }: SkillsJustificationProps) {
  const selectedSkillIds = form.watch("selected_skills") || [];
  const selectedSkills = SKILLS.filter(skill => selectedSkillIds.includes(skill.id));
  
  return (
    <FormField
      control={form.control}
      name="skills_justification"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-lg font-medium">
            Justify the selected skills <span className="text-red-500">*</span>
          </FormLabel>
          <FormDescription>
            How did each skill contribute to the creation of the work?
            What actions, decisions, or moments during the process
            demonstrated these skills?
          </FormDescription>
          
          {selectedSkills.length > 0 && (
            <Alert className="bg-blue-50 border-blue-100 mb-4">
              <InfoIcon className="h-5 w-5 text-blue-500" />
              <AlertDescription className="text-blue-700">
                <p className="font-medium mb-2">Your selected skills:</p>
                <ul className="list-disc pl-5 space-y-2">
                  {selectedSkills.map(skill => (
                    <li key={skill.id}>
                      <span className="font-medium">{skill.name}</span>
                      {skill.description && (
                        <p className="text-sm text-blue-600 mt-1">{skill.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          <FormControl>
            <RichCharacterLimitedTextarea
              placeholder="How did each skill help you in creating this work?"
              value={field.value || ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              required
              currentLength={field.value?.length || 0}
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