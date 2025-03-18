import { ReflectionField } from "../ReflectionField";
import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFormValues } from "@/lib/validations/assignment";

interface ImprovementsProps {
  form: UseFormReturn<AssignmentFormValues>;
  currentLength: number;
}

export function Improvements({ form, currentLength }: ImprovementsProps) {
  return (
    <ReflectionField
      form={form}
      name="improvements"
      label="Your improvements"
      description="If you could do this work again, what would you do differently?"
      placeholder="Suggest improvements"
      currentLength={currentLength}
    />
  );
} 