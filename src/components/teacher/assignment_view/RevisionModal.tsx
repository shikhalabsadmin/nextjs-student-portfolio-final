import React, { useState, useCallback, memo, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface RevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: string) => Promise<void>;
  currentFeedback?: string;
}

export const RevisionModal = memo(({
  isOpen,
  onClose,
  onSubmit,
  currentFeedback = '',
}: RevisionModalProps) => {
  const [feedback, setFeedback] = useState(currentFeedback);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Update feedback when currentFeedback prop changes
  useEffect(() => {
    setFeedback(currentFeedback);
  }, [currentFeedback]);

  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      // Don't reset immediately to avoid visual glitches during closing animation
      const timer = setTimeout(() => {
        setError("");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = useCallback(async () => {
    if (!feedback.trim()) {
      setError("Please provide specific feedback for the student.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    
    try {
      await onSubmit(feedback);
      onClose();
    } catch (err) {
      setError("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [feedback, onSubmit, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-black/80" />
        <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-[550px] translate-x-[-50%] translate-y-[-50%] bg-white p-8 shadow-lg border border-gray-200">
          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-gray-900">Send for revision</h2>
              <p className="text-gray-600 text-base">
                Please specify what the student should revise.
              </p>
            </div>

            {/* Feedback input */}
            <div className="space-y-2">
              <label htmlFor="feedback" className="block text-base font-medium text-gray-900">
                Clearly explain what needs improvement.
              </label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Eg: Clarify Skills Used, Expand Reflection"
                className="min-h-[120px] resize-y w-full border border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 rounded-md"
                disabled={isSubmitting}
              />
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>

            {/* Suggestion text */}
            <div className="text-gray-600 text-base">
              Suggestion: Be specific to help the student refine their work.
            </div>

            {/* Action buttons */}
            <div className="flex justify-start gap-3 pt-4">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-[#6366F1] hover:bg-[#4F46E5] text-white font-medium rounded-md h-10 px-6 py-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending...
                  </>
                ) : "Send"}
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="font-medium rounded-md h-10 px-6 py-2 border-gray-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  );
});

RevisionModal.displayName = 'RevisionModal'; 