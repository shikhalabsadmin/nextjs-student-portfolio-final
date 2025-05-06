import { ReflectionField } from "../ReflectionField";
import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFormValues } from "@/lib/validations/assignment";

interface CreationProcessProps {
  form: UseFormReturn<AssignmentFormValues>;
  currentLength: number;
}

export function CreationProcess({ form, currentLength }: CreationProcessProps) {
  return (
    <ReflectionField
      form={form}
      name="creation_process"
      label="Describe the process you used to create it"
      description="Detail step-by-step how you created the work: Planning: Did you use any strategies or tools to plan your work? Execution: How did you approach each stage of the work? Reflection: How did you ensure the quality of their work along the way?"
      placeholder="Explain your process"
      currentLength={currentLength}
    />
  );
} 