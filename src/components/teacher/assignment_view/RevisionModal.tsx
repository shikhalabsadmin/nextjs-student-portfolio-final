import { useEffect, memo } from "react";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/RichTextEditor";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Define form validation schema
const formSchema = z.object({
  feedback: z.string().min(1, "Please provide specific feedback for the student."),
});

type FormValues = z.infer<typeof formSchema>;

interface RevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: string) => Promise<void>;
  currentFeedback?: string;
}

export const RevisionModal = memo(
  ({ isOpen, onClose, onSubmit, currentFeedback = "" }: RevisionModalProps) => {
    const form = useForm<FormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        feedback: currentFeedback,
      },
    });

    const isSubmitting = form.formState.isSubmitting;

    // Update form values when currentFeedback changes
    useEffect(() => {
      if (currentFeedback) {
        form.setValue("feedback", currentFeedback);
      }
    }, [currentFeedback, form]);

    // Reset the form when modal closes
    useEffect(() => {
      if (!isOpen) {
        // Delay reset to avoid visual glitches during closing animation
        const timer = setTimeout(() => {
          if (!currentFeedback) {
            form.reset();
          }
        }, 300);
        return () => clearTimeout(timer);
      }
    }, [isOpen, form, currentFeedback]);

    const handleSubmit = async (values: FormValues) => {
      try {
        await onSubmit(values.feedback);
        onClose();
      } catch (err) {
        form.setError("root", {
          message: "Failed to submit feedback. Please try again."
        });
      }
    };

    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 z-50 bg-black/80" />
          <div className="fixed left-[50%] top-[50%] z-50 grid w-[95vw] max-w-[20rem] sm:max-w-[24rem] md:max-w-3xl translate-x-[-50%] translate-y-[-50%] bg-white px-3 py-4 sm:px-5 sm:py-7 md:px-10 md:py-[56px] shadow-lg border border-slate-200 rounded-[6px] max-h-[90vh] overflow-y-auto">
            <div className="space-y-2 sm:space-y-5 md:space-y-10">
              {/* Title */}
              <div className="space-y-1 sm:space-y-2">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">
                  Send for revision
                </h2>
                <p className="text-xs sm:text-sm md:text-base text-slate-600 font-normal">
                  Please specify what the student should revise.
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 sm:space-y-6">
                  {/* Feedback input */}
                  <FormField
                    control={form.control}
                    name="feedback"
                    render={({ field }) => (
                      <FormItem className="space-y-[6px]">
                        <FormLabel className="block text-xs sm:text-sm font-medium text-slate-900">
                          Clearly explain what needs improvement.
                        </FormLabel>
                        <FormControl>
                          <RichTextEditor
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Eg: Clarify Skills Used, Expand Reflection"
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-xs sm:text-sm" />
                        <FormDescription className="text-slate-500 text-xs sm:text-sm font-normal">
                          Suggestion: Be specific to help the student refine their work.
                        </FormDescription>
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
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-3 py-2 font-medium text-xs sm:text-sm rounded-[6px] bg-indigo-500 hover:bg-indigo-600 text-white"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Sending...
                        </>
                      ) : (
                        "Send"
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

RevisionModal.displayName = "RevisionModal";