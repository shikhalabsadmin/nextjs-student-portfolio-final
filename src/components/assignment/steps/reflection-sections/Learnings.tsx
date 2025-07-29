import { RichReflectionField } from "../RichReflectionField";
import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFormValues } from "@/lib/validations/assignment";

interface LearningsProps {
  form: UseFormReturn<AssignmentFormValues>;
  currentLength: number;
}

export function Learnings({ form, currentLength }: LearningsProps) {
  return (
    <RichReflectionField
      form={form}
      name="learnings"
      label="Your learnings and future applications"
      description="What did you learn from this work? How will you apply these learnings in the future?"
      placeholder="Share your learnings"
      currentLength={currentLength}
    />
  );
} 