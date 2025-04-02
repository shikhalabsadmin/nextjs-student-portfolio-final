import { useState, useEffect, memo } from "react";
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

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (skillsData: FormValues) => Promise<void>;
}

export const ApprovalModal = memo(
  ({ isOpen, onClose, onSubmit }: ApprovalModalProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        selectedSkills: [],
        justification: "",
        feedback: "",
      },
    });

    // Reset form when modal is opened or closed
    useEffect(() => {
      if (!isOpen) {
        // Don't reset immediately to avoid visual glitches during closing animation
        const timer = setTimeout(() => {
          form.reset();
        }, 300);
        return () => clearTimeout(timer);
      }
    }, [isOpen, form]);

    const handleSubmitForm = async (values: FormValues) => {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
        form.reset();
        onClose();
      } catch (err) {
        form.setError("root", {
          message: "Failed to submit approval. Please try again.",
        });
      } finally {
        setIsSubmitting(false);
      }
    };

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
                          {SKILLS.map((skill) => (
                            <div
                              key={skill}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`skill-${skill}`}
                                checked={field.value.includes(skill)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    if (field.value.length < 3) {
                                      field.onChange([...field.value, skill]);
                                    }
                                  } else {
                                    field.onChange(
                                      field.value.filter(
                                        (value) => value !== skill
                                      )
                                    );
                                  }
                                }}
                                disabled={
                                  !field.value.includes(skill) &&
                                  field.value.length >= 3
                                }
                              />
                              <Label
                                htmlFor={`skill-${skill}`}
                                className="text-xs sm:text-sm font-medium text-slate-900"
                              >
                                {skill}
                              </Label>
                            </div>
                          ))}
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
                            className="min-h-[100px] sm:min-h-[120px] resize-y w-full border border-slate-300 rounded-md text-sm text-slate-400 font-normal"
                            disabled={isSubmitting}
                            maxLength={200}
                          />
                        </FormControl>
                        <div className="relative w-full flex">
                          <FormMessage className="text-red-500 text-xs sm:text-sm" />
                          <span className="absolute right-0 text-slate-500 text-xs sm:text-sm font-normal">
                            {field.value.length}/200
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
                            className="min-h-[100px] sm:min-h-[120px] resize-y w-full border border-slate-300 rounded-md text-sm text-slate-400 font-normal"
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
                      className="w-full sm:w-auto px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm rounded-[6px] border-slate-300 text-slate-800"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm rounded-[6px] bg-indigo-500 hover:bg-indigo-600 text-white"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Confirming...
                        </>
                      ) : (
                        "Confirm"
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
