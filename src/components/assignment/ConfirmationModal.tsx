import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-w-[90vw] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Ready to Submit Your Artifact?</DialogTitle>
          <DialogDescription className="text-sm pt-1.5">
            Once submitted, you won't be able to make any changes unless your
            teacher requests revisions. Are you sure you want to proceed?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="w-full flex flex-col sm:flex-row gap-2 sm:gap-2.5 !justify-start mt-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            className="bg-[#6366F1] hover:bg-[#6366F1]/90 text-white w-full sm:w-auto"
            onClick={onConfirm}
          >
            Confirm & Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
