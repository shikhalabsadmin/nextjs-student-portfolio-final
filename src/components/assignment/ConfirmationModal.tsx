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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ready to Submit Your Artifact?</DialogTitle>
          <DialogDescription>
            Once submitted, you won’t be able to make any changes unless your
            teacher requests revisions. Are you sure you want to proceed?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="w-full flex gap-2.5 !justify-start">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-[#6366F1] hover:bg-[#6366F1]/90 text-white"
            onClick={onConfirm}
          >
            Confirm & Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
