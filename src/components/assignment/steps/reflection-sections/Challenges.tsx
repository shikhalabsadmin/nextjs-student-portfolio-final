import { RichReflectionField } from "../RichReflectionField";
import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFormValues } from "@/lib/validations/assignment";

interface ChallengesProps {
  form: UseFormReturn<AssignmentFormValues>;
  currentLength: number;
}

export function Challenges({ form, currentLength }: ChallengesProps) {
  return (
    <RichReflectionField
      form={form}
      name="challenges"
      label="Your challenges"
      description="What challenges did you face and how did you overcome them?"
      placeholder="Describe your challenges"
      currentLength={currentLength}
    />
  );
} 