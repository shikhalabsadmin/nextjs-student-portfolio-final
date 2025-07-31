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
      <>
        {isOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '800px',
              height: '70vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
              {/* Header */}
              <div style={{
                padding: '24px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, marginBottom: '8px' }}>
                  Send for revision
                </h2>
                <p style={{ color: '#6b7280', margin: 0 }}>
                  Please specify what the student should revise.
                </p>
              </div>

              {/* Scrollable Content */}
              <div style={{
                flex: 1,
                overflow: 'auto',
                padding: '24px'
              }}>
                <Form {...form}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                  </div>
                </Form>
              </div>

              {/* Footer */}
              <div style={{
                borderTop: '1px solid #e5e7eb',
                padding: '24px',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={form.handleSubmit(handleSubmit)}
                  disabled={isSubmitting}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  {isSubmitting ? "Sending..." : "Send"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
);

RevisionModal.displayName = "RevisionModal";