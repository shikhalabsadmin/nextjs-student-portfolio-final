import { RichReflectionField } from "../RichReflectionField";
import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFormValues } from "@/lib/validations/assignment";

interface AcknowledgmentsProps {
  form: UseFormReturn<AssignmentFormValues>;
  currentLength: number;
}

export function Acknowledgments({ form, currentLength }: AcknowledgmentsProps) {
  return (
    <RichReflectionField
      form={form}
      name="acknowledgments"
      label="Your gratitude"
      description="Who helped you with this work? How would you like to gratitude them?"
      placeholder="Share your acknowledgments"
      currentLength={currentLength}
    />
  );
} 