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
import { RichTextEditor } from "@/components/RichTextEditor";

// Define skills list as a constant for reuse
const SKILLS = [
  "Motivation",
  "Intellect",
  "Diligence",
  "Emotionality",
  "Sociability",
];

// Define a single form validation schema with context
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
  isRevision: z.boolean().optional(), // Context field to determine validation
}).refine((data) => {
  // If it's a revision, feedback should be required
  if (data.isRevision && (!data.feedback || data.feedback.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Please provide feedback for the revision",
  path: ["feedback"]
});

type FormValues = z.infer<typeof formSchema>;

// Separate hook for form logic to follow SRP
const useApprovalForm = (defaultValues: Omit<FormValues, 'isRevision'>) => {
  return useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...defaultValues,
      isRevision: false
    },
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

const ApprovalModal = memo(
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
      // Make sure isRevision is false for approval
      const valuesWithContext = { ...values, isRevision: false };
      
      // Validate with the schema (though feedback is optional here)
      const result = formSchema.safeParse(valuesWithContext);
      if (!result.success) {
        // Set field errors from validation
        result.error.format();
        return;
      }
      
      setIsSubmitting(true);
      try {
        // Pass form data to parent component (without isRevision flag)
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
      // Get form values
      const values = form.getValues();
      
      // Add isRevision flag to trigger feedback validation
      const valuesWithContext = { ...values, isRevision: true };
      
      // Validate with the schema
      const result = formSchema.safeParse(valuesWithContext);
      if (!result.success) {
        // Extract and set the errors from zod validation
        const zodErrors = result.error.flatten().fieldErrors;
        
        // Set feedback error if present
        if (zodErrors.feedback) {
          form.setError("feedback", {
            type: "manual",
            message: zodErrors.feedback[0]
          });
          return;
        }
        
        // Set other errors if any
        if (zodErrors.selectedSkills) {
          form.setError("selectedSkills", {
            type: "manual",
            message: zodErrors.selectedSkills[0]
          });
        }
        
        if (zodErrors.justification) {
          form.setError("justification", {
            type: "manual",
            message: zodErrors.justification[0]
          });
        }
        
        return;
      }
      
      setIsSubmitting(true);
      try {
        // Pass form data to parent component (without isRevision flag)
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
          <div className="fixed left-[50%] top-[50%] z-50 grid w-[95vw] max-w-[20rem] sm:max-w-[24rem] md:max-w-3xl translate-x-[-50%] translate-y-[-50%] bg-white px-3 py-4 sm:px-5 sm:py-7 md:px-10 md:py-[56px] shadow-lg border border-slate-200 rounded-[6px] max-h-[90vh] overflow-y-auto">
            <div className="space-y-2 sm:space-y-5 md:space-y-10">
              {/* Title */}
              <div className="space-y-1 sm:space-y-2">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">
                  Approve Assignment
                </h2>
                <p className="text-xs sm:text-sm md:text-base text-slate-600 font-normal">
                  Evaluate the student's work before approving.
                </p>
              </div>

              <Form {...form}>
                <form className="space-y-4 sm:space-y-6">
                  {/* Skills Selection */}
                  <FormField
                    control={form.control}
                    name="selectedSkills"
                    render={({ field }) => (
                      <FormItem className="space-y-[6px]">
                        <FormLabel className="block text-xs sm:text-sm font-medium text-slate-900">
                          Select up to 3 skills demonstrated
                        </FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                            {SKILLS.map((skill) =>
                              renderSkillCheckbox(skill, field)
                            )}
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500 text-xs sm:text-sm" />
                      </FormItem>
                    )}
                  />

                  {/* Skills Justification */}
                  <FormField
                    control={form.control}
                    name="justification"
                    render={({ field }) => (
                      <FormItem className="space-y-[6px]">
                        <FormLabel className="block text-xs sm:text-sm font-medium text-slate-900">
                          Justify the skills selection
                        </FormLabel>
                        <FormControl>
                          <RichTextEditor
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Explain why these skills were demonstrated..."
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-xs sm:text-sm" />
                        <FormDescription className="text-slate-500 text-xs sm:text-sm font-normal">
                          <span className="text-slate-400">
                            {field.value?.length || 0}/200
                          </span>
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  {/* Optional Feedback */}
                  <FormField
                    control={form.control}
                    name="feedback"
                    render={({ field }) => (
                      <FormItem className="space-y-[6px]">
                        <FormLabel className="block text-xs sm:text-sm font-medium text-slate-900">
                          Additional feedback (optional)
                        </FormLabel>
                        <FormControl>
                          <RichTextEditor
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Add any additional comments..."
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-xs sm:text-sm" />
                      </FormItem>
                    )}
                  />

                  {form.formState.errors.root && (
                    <p className="text-red-500 text-xs sm:text-sm">
                      {form.formState.errors.root.message}
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row justify-start gap-2 sm:gap-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-3 py-2 font-medium text-xs sm:text-sm rounded-[6px] border-slate-300 text-slate-800"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleRevision}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-3 py-2 font-medium text-xs sm:text-sm rounded-[6px] bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Sending...
                        </>
                      ) : (
                        "Send for Revision"
                      )}
                    </Button>
                    <Button
                      type="button"
                      onClick={form.handleSubmit(handleSubmitForm)}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-3 py-2 font-medium text-xs sm:text-sm rounded-[6px] bg-indigo-500 hover:bg-indigo-600 text-white"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Approving...
                        </>
                      ) : (
                        "Approve"
                      )}
                    </Button>
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

ApprovalModal.displayName = "ApprovalModal";

export { ApprovalModal };