import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFormValues } from "@/lib/validations/assignment";
import { SkillsSelection } from "./SkillsSelection";
import { SkillsJustification } from "./SkillsJustification";
import { PrideReason } from "./PrideReason";

interface ProcessStepProps {
  form: UseFormReturn<AssignmentFormValues>;
}

export function ProcessStep({ form }: ProcessStepProps) {
  return (
    <div className="space-y-6 px-4 sm:px-0">
      <SkillsSelection form={form} />
      <SkillsJustification form={form} />
      <PrideReason form={form} />
    </div>
  );
}
