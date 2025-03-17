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
import { useState, useEffect } from "react";

interface ReflectionStepProps {
  form: UseFormReturn<AssignmentFormValues>;
}

export function ReflectionStep({ form }: ReflectionStepProps) {
  const [charCounts, setCharCounts] = useState({
    creation_process: form.getValues("creation_process")?.length || 0,
    learnings: form.getValues("learnings")?.length || 0,
    challenges: form.getValues("challenges")?.length || 0,
    improvements: form.getValues("improvements")?.length || 0,
    acknowledgments: form.getValues("acknowledgments")?.length || 0,
  });

  useEffect(() => {
    // Initialize character counts when form values change
    const subscription = form.watch((value) => {
      setCharCounts({
        creation_process: value.creation_process?.length || 0,
        learnings: value.learnings?.length || 0,
        challenges: value.challenges?.length || 0,
        improvements: value.improvements?.length || 0,
        acknowledgments: value.acknowledgments?.length || 0,
      });
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const handleTextChange = (name: string, value: string) => {
    setCharCounts((prev) => ({
      ...prev,
      [name]: value.length,
    }));
  };

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="creation_process"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium">
              Describe the process you used to create it{" "}
              <span className="text-red-500">*</span>
            </FormLabel>
            <FormDescription>
              Detail step-by-step how you created the artifact: Planning: Did
              you use any strategies or tools to plan your work? Execution: How
              did you approach each stage of the work? Reflection: How did you
              ensure the quality of their work along the way?
            </FormDescription>
            <FormControl>
              <Textarea
                placeholder="Explain your process"
                className="min-h-[100px]"
                {...field}
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(e);
                  handleTextChange("creation_process", e.target.value);
                }}
                maxLength={200}
                required
              />
            </FormControl>
            <div className="flex justify-end text-xs text-gray-500 mt-1">
              {charCounts.creation_process}/200 max
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="learnings"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium">
              Your learnings and future applications{" "}
              <span className="text-red-500">*</span>
            </FormLabel>
            <FormDescription>
              What did you learn from this work? How will you apply these
              learnings in the future?
            </FormDescription>
            <FormControl>
              <Textarea
                placeholder="Share your learnings"
                className="min-h-[100px]"
                {...field}
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(e);
                  handleTextChange("learnings", e.target.value);
                }}
                maxLength={200}
                required
              />
            </FormControl>
            <div className="flex justify-end text-xs text-gray-500 mt-1">
              {charCounts.learnings}/200 max
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="challenges"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium">
              Your challenges <span className="text-red-500">*</span>
            </FormLabel>
            <FormDescription>
              What challenges did you face and how did you overcome them?
            </FormDescription>
            <FormControl>
              <Textarea
                placeholder="Describe your challenges"
                className="min-h-[100px]"
                {...field}
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(e);
                  handleTextChange("challenges", e.target.value);
                }}
                maxLength={200}
                required
              />
            </FormControl>
            <div className="flex justify-end text-xs text-gray-500 mt-1">
              {charCounts.challenges}/200 max
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="improvements"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium">
              Your improvements <span className="text-red-500">*</span>
            </FormLabel>
            <FormDescription>
              If you could do this work again, what would you do differently?
            </FormDescription>
            <FormControl>
              <Textarea
                placeholder="Suggest improvements"
                className="min-h-[100px]"
                {...field}
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(e);
                  handleTextChange("improvements", e.target.value);
                }}
                maxLength={200}
                required
              />
            </FormControl>
            <div className="flex justify-end text-xs text-gray-500 mt-1">
              {charCounts.improvements}/200 max
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="acknowledgments"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium">
              Your thanks <span className="text-red-500">*</span>
            </FormLabel>
            <FormDescription>
              Who helped you with this work? How would you like to thank them?
            </FormDescription>
            <FormControl>
              <Textarea
                placeholder="Share your acknowledgments"
                className="min-h-[100px]"
                {...field}
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(e);
                  handleTextChange("acknowledgments", e.target.value);
                }}
                maxLength={200}
                required
              />
            </FormControl>
            <div className="flex justify-end text-xs text-gray-500 mt-1">
              {charCounts.acknowledgments}/200 max
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
