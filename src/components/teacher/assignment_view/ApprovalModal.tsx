import { useState, useEffect, memo, useMemo } from "react";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Define skills list as a constant for reuse
const SKILLS = [
  "Motivation",
  "Intellect",
  "Diligence",
  "Emotionality",
  "Sociability",
];

// Define form validation schema
const formSchema = z.object({
  selectedSkills: z
    .array(z.string())
    .min(1, "Please select at least one skill")
    .max(3, "You can select up to 3 skills"),
  justification: z
    .string()
    .min(1, "Please justify the selected skills")
    .max(200, "Justification must be less than 200 characters"),
  feedback: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Separate hook for form logic to follow SRP
const useApprovalForm = (defaultValues: FormValues) => {
  return useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
};

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRevision: (formData: FormValues) => Promise<void>;
  onApprove: (formData: FormValues) => Promise<void>;
  defaultStates: {
    selectedSkills?: string[];
    justification?: string;
    feedback?: string;
  };
  onFormDataChange: (formData: FormValues) => void;
}

export const ApprovalModal = memo(
  ({
    isOpen,
    onClose,
    onRevision,
    onApprove,
    defaultStates,
    onFormDataChange,
  }: ApprovalModalProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Normalize default skills with memoization
    const normalizedDefaultSkills = useMemo(
      () =>
        defaultStates?.selectedSkills?.map((skill) => {
          // Try to find a match in SKILLS ignoring case
          return (
            SKILLS.find((s) => s.toLowerCase() === skill.toLowerCase()) || skill
          );
        }) || [],
      [defaultStates?.selectedSkills]
    );

    // Create form with memoized defaultValues
    const defaultFormValues = useMemo(
      () => ({
        selectedSkills: normalizedDefaultSkills,
        justification: defaultStates?.justification || "",
        feedback: defaultStates?.feedback || "",
      }),
      [
        normalizedDefaultSkills,
        defaultStates?.justification,
        defaultStates?.feedback,
      ]
    );

    const form = useApprovalForm(defaultFormValues);

    // Reset form when modal is opened or closed
    useEffect(() => {
      if (isOpen) {
        // Reset with provided defaults when modal opens
        form.reset(defaultFormValues);
      }
    }, [isOpen, form, defaultFormValues]);

    // Handle submission for approval
    const handleSubmitForm = async (values: FormValues) => {
      setIsSubmitting(true);
      try {
        // Pass form data to parent component
        onFormDataChange(values);

        // Call the appropriate function based on action (approve)
        await onApprove(values);
        onClose();
      } catch (err) {
        form.setError("root", {
          message: "Failed to submit approval. Please try again.",
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    // Handle submission for revision
    const handleRevision = async () => {
      const values = form.getValues();
      setIsSubmitting(true);
      try {
        // Pass form data to parent component
        onFormDataChange(values);

        // Call the revision function
        await onRevision(values);
        onClose();
      } catch (err) {
        form.setError("root", {
          message: "Failed to submit revision request. Please try again.",
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    // Conditionally render checkbox component to reduce complexity
    const renderSkillCheckbox = (
      skill: string,
      field: {
        value: string[] | undefined;
        onChange: (value: string[]) => void;
      }
    ) => (
      <div key={skill} className="flex items-center space-x-2">
        <Checkbox
          id={`skill-${skill}`}
          checked={field.value?.includes?.(skill) || false}
          onCheckedChange={(checked) => {
            if (checked) {
              if ((field.value?.length || 0) < 3) {
                field.onChange([...(field.value || []), skill]);
              }
            } else {
              field.onChange(
                field.value?.filter?.((value) => value !== skill) || []
              );
            }
          }}
          disabled={
            (!field.value?.includes?.(skill) &&
              (field.value?.length || 0) >= 3) ||
            isSubmitting
          }
        />
        <Label
          htmlFor={`skill-${skill}`}
          className="text-xs sm:text-sm font-medium text-slate-900"
        >
          {skill}
        </Label>
      </div>
    );

    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 z-50 bg-black/80" />
          <div className="fixed left-[50%] top-[50%] z-50 grid w-[90vw] max-w-[20rem] sm:max-w-[24rem] md:max-w-3xl translate-x-[-50%] translate-y-[-50%] bg-white px-4 py-5 sm:px-5 sm:py-7 md:px-10 md:py-[56px] shadow-lg border border-slate-200 rounded-[6px]">
            <div className="space-y-2.5 sm:space-y-5 md:space-y-10">
              {/* Title */}
              <div className="space-y-1 sm:space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Confirm Approval
                </h2>
                <p className="text-sm sm:text-base text-slate-600 font-normal">
                  You're about to approve this assignment. Once approved, it
                  will be added to the student's portfolio.
                </p>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmitForm)}
                  className="space-y-4 sm:space-y-6 md:space-y-8"
                >
                  {/* Skills selection */}
                  <FormField
                    control={form.control}
                    name="selectedSkills"
                    render={({ field }) => (
                      <FormItem className="space-y-1 sm:space-y-2 md:space-y-3">
                        <FormLabel className="block text-xs sm:text-sm md:text-base font-semibold text-slate-900">
                          What skills did you think the student practice?
                          (Select Top 3)
                        </FormLabel>
                        <div className="flex flex-wrap gap-3 sm:gap-4 md:gap-8">
                          {SKILLS.map((skill) =>
                            renderSkillCheckbox(skill, field)
                          )}
                        </div>
                        <FormMessage className="text-red-500 text-xs sm:text-sm" />
                      </FormItem>
                    )}
                  />

                  {/* Justify skills */}
                  <FormField
                    control={form.control}
                    name="justification"
                    render={({ field }) => (
                      <FormItem className="space-y-1 sm:space-y-2 md:space-y-3">
                        <div className="flex flex-col gap-1">
                          <FormLabel className="block text-xs sm:text-sm md:text-base font-semibold text-slate-900">
                            Justify the selected skills
                          </FormLabel>
                          <FormDescription className="text-slate-600 text-xs md:text-sm font-normal">
                            How did each skill contribute to the creation of the
                            artifact? What actions, decisions, or moments during
                            the process demonstrated these skills?
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="How did each skill help in creating this artifact?"
                            className="min-h-[100px] sm:min-h-[120px] resize-y w-full border border-slate-300 rounded-md text-sm font-normal text-slate-900 placeholder:text-slate-400"
                            disabled={isSubmitting}
                            maxLength={200}
                          />
                        </FormControl>
                        <div className="relative w-full flex">
                          <FormMessage className="text-red-500 text-xs sm:text-sm" />
                          <span className="absolute right-0 text-slate-500 text-xs sm:text-sm font-normal">
                            {field.value?.length || 0}/200
                          </span>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Feedback (optional) */}
                  <FormField
                    control={form.control}
                    name="feedback"
                    render={({ field }) => (
                      <FormItem className="space-y-1 sm:space-y-2">
                        <div className="flex justify-between">
                          <FormLabel className="block text-xs sm:text-sm font-medium text-slate-900">
                            Feedback
                          </FormLabel>
                          <span className="text-slate-500 text-sm font-normal">
                            (optional)
                          </span>
                        </div>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Eg: Keep up the good work!"
                            className="min-h-[100px] sm:min-h-[120px] resize-y w-full border border-slate-300 rounded-md text-sm font-normal text-slate-900 placeholder:text-slate-400"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription className="text-slate-500 text-xs sm:text-sm font-normal">
                          Suggestion: Express appreciation for your student or
                          share words of encouragement.
                        </FormDescription>
                        <FormMessage className="text-red-500 text-xs sm:text-sm" />
                      </FormItem>
                    )}
                  />

                  {form.formState.errors.root && (
                    <p className="text-red-500 text-xs sm:text-sm">
                      {form.formState.errors.root?.message}
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row justify-start gap-2 sm:gap-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm rounded-[6px] border-slate-300 text-slate-800"
                    >
                      Cancel
                    </Button>
                    <div className="flex flex-1 flex-row justify-end gap-2.5">
                      <>
                        {isSubmitting ? (
                          <>
                            <div className="flex items-center justify-center bg-slate-200 rounded-md p-5">
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            </div>
                          </>
                        ) : (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleRevision}
                              disabled={isSubmitting}
                              className="w-full sm:w-auto px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm rounded-[6px] border-slate-300 text-slate-800"
                            >
                              Send for revision
                            </Button>
                            <Button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => handleSubmitForm(form.getValues())}
                              className="w-full sm:w-auto px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm rounded-[6px] bg-indigo-500 hover:bg-indigo-600 text-white"
                            >
                              Approve
                            </Button>
                          </>
                        )}
                      </>
                    </div>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </DialogPortal>
      </Dialog>
    );
  }
);
