import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFormValues } from "@/lib/validations/assignment";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

interface ReflectionStepProps {
  form: UseFormReturn<AssignmentFormValues>;
}

export function ReflectionStep({ form }: ReflectionStepProps) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="learnings"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Your learnings and future applications</FormLabel>
            <FormControl>
              <Textarea
                placeholder="What did you learn from this work? How will you apply these learnings in the future?"
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
        name="challenges"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Your challenges</FormLabel>
            <FormControl>
              <Textarea
                placeholder="What challenges did you face and how did you overcome them?"
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
        name="improvements"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Your improvements</FormLabel>
            <FormControl>
              <Textarea
                placeholder="If you could do this work again, what would you do differently?"
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
        name="acknowledgments"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Your thanks</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Who helped you with this work? How would you like to thank them?"
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