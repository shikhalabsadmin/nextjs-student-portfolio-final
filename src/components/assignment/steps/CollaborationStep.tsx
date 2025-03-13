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

interface CollaborationStepProps {
  form: UseFormReturn<AssignmentFormValues>;
}

export function CollaborationStep({ form }: CollaborationStepProps) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="is_team_work"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Team Project</FormLabel>
              <FormDescription>
                Is this a team project or individual work?
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {form.watch("is_team_work") && (
        <FormField
          control={form.control}
          name="team_contribution"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Describe your role and experience</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What was your specific contribution to the team project?"
                  className="min-h-[100px]"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="is_original_work"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Original Work</FormLabel>
              <FormDescription>
                Did you create something new or original?
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {form.watch("is_original_work") && (
        <FormField
          control={form.control}
          name="originality_explanation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Explain what was new</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What aspects of your work were original or innovative?"
                  className="min-h-[100px]"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
} 