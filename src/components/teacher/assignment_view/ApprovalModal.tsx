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
import { QuestionComment } from "@/lib/validations/assignment";
import { MessageCircle } from "lucide-react";
import { getQuestionLabel } from "@/lib/utils/question-mapping";

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
    mode: "onChange", // Enable real-time validation
    criteriaMode: "all",
    shouldFocusError: true,
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
    questionComments?: Record<string, QuestionComment>;
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

    // Watch form values for validation
    const selectedSkills = form.watch("selectedSkills");
    const justification = form.watch("justification");
    const feedback = form.watch("feedback");

    // Validation logic for button states
    const isApprovalValid = useMemo(() => {
      return (
        selectedSkills?.length > 0 &&
        selectedSkills.length <= 3 &&
        justification?.trim().length > 0 &&
        justification.length <= 200
      );
    }, [selectedSkills, justification]);

    const isRevisionValid = useMemo(() => {
      return (
        isApprovalValid &&
        feedback?.trim().length > 0
      );
    }, [isApprovalValid, feedback]);

    // Debug logging
    useEffect(() => {
      if (isOpen) {
        console.log('[ApprovalModal] Modal opened with defaultStates:', defaultStates);
        console.log('[ApprovalModal] Question comments:', defaultStates.questionComments);
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
              height: '80vh',
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
                  Approve Assignment
                </h2>
                <p style={{ color: '#6b7280', margin: 0 }}>
                  Evaluate the student's work before approving.
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

                    {/* Question Comments Summary */}
                    {defaultStates.questionComments && Object.keys(defaultStates.questionComments).length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 text-blue-600" />
                          <h4 className="text-sm font-medium text-blue-900">
                            Question Comments ({Object.keys(defaultStates.questionComments).length})
                          </h4>
                        </div>
                        <div className="space-y-3">
                          {Object.entries(defaultStates.questionComments).map(([questionId, comment]) => (
                            <div key={questionId} className="bg-white border border-blue-200 rounded-md p-3">
                              <div className="text-xs font-medium text-blue-800 mb-1">
                                Question: {getQuestionLabel(questionId)}
                              </div>
                              <div className="text-sm text-gray-700 mb-2">
                                {comment.comment}
                              </div>
                              <div className="text-xs text-blue-600">
                                {new Date(comment.timestamp).toLocaleDateString()} at{' '}
                                {new Date(comment.timestamp).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
                          💡 These question-specific comments will be included in your feedback to the student
                        </div>
                      </div>
                    )}

                    {/* Feedback Field with Conditional Validation */}
                    <FormField
                      control={form.control}
                      name="feedback"
                      render={({ field }) => (
                        <FormItem className="space-y-[6px]">
                          <FormLabel className="block text-xs sm:text-sm font-medium text-slate-900">
                            Additional feedback 
                            <span className="text-red-500"> (required for revision)</span>
                          </FormLabel>
                          <FormControl>
                            <RichTextEditor
                              value={field.value || ""}
                              onChange={field.onChange}
                              placeholder="Add specific feedback for what needs to be revised..."
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-xs sm:text-sm" />
                          <FormDescription className="text-slate-500 text-xs sm:text-sm font-normal">
                            {!isRevisionValid && feedback?.trim().length === 0 && (
                              <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                💡 Feedback is required to send for revision
                              </span>
                            )}
                          </FormDescription>
                        </FormItem>
                      )}
                    />



                    {/* Validation Summary */}
                    {(!isApprovalValid || !isRevisionValid) && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 space-y-2">
                        <h4 className="text-sm font-medium text-yellow-800">
                          Please complete the following:
                        </h4>
                        <ul className="text-xs sm:text-sm text-yellow-700 space-y-1">
                          {selectedSkills?.length === 0 && (
                            <li className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                              Select at least one skill (up to 3)
                            </li>
                          )}
                          {!justification?.trim() && (
                            <li className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                              Provide justification for selected skills
                            </li>
                          )}
                          {justification && justification.length > 200 && (
                            <li className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                              Justification must be 200 characters or less
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

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
                flexDirection: 'column',
                gap: '12px'
              }}>
                {/* Button Status Indicators */}
                {(!isApprovalValid || !isRevisionValid) && (
                  <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">Button Status:</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isApprovalValid ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                        <span className={isApprovalValid ? 'text-green-700' : 'text-gray-500'}>
                          Approve: {isApprovalValid ? 'Ready' : 'Complete skills and justification'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isRevisionValid ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                        <span className={isRevisionValid ? 'text-green-700' : 'text-gray-500'}>
                          Send for Revision: {isRevisionValid ? 'Ready' : 'Complete all fields including feedback'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{
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
                    onClick={handleRevision}
                    disabled={isSubmitting || !isRevisionValid}
                    className="bg-amber-500 hover:bg-amber-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                    title={!isRevisionValid ? "Complete all required fields to send for revision" : ""}
                  >
                    {isSubmitting ? "Sending..." : "Send for Revision"}
                  </Button>
                  <Button
                    type="button"
                    onClick={form.handleSubmit(handleSubmitForm)}
                    disabled={isSubmitting || !isApprovalValid}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                    title={!isApprovalValid ? "Complete skills selection and justification to approve" : ""}
                  >
                    {isSubmitting ? "Approving..." : "Approve"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
);

ApprovalModal.displayName = "ApprovalModal";

export { ApprovalModal };