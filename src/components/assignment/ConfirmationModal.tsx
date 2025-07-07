import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

type ConfirmationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function ConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
}: ConfirmationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      // If we're still on this page after submission, reset the state
      // (this may not run if we navigate away)
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      // Don't allow closing the dialog during submission
      if (isSubmitting && !isOpen) return;
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ready to Submit Your Artifact?</DialogTitle>
          <DialogDescription>
            Once submitted, you won't be able to make any changes unless your
            teacher requests revisions. Are you sure you want to proceed?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="w-full flex gap-2.5 !justify-start">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            className="bg-[#6366F1] hover:bg-[#6366F1]/90 text-white"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Confirm & Submit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
