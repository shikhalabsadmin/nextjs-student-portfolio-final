import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFormValues } from "@/lib/validations/assignment";
import { SkillsSelection } from "./SkillsSelection";
import { SkillsJustification } from "./SkillsJustification";
import { PrideReason } from "./PrideReason";

interface SkillsReflectionStepProps {
  form: UseFormReturn<AssignmentFormValues>;
}

export function SkillsReflectionStep({ form }: SkillsReflectionStepProps) {
  return (
    <div className="space-y-8 px-4 sm:px-0">
      <div className="space-y-6">
        <SkillsSelection form={form} />
        <SkillsJustification form={form} />
        <PrideReason form={form} />
      </div>
    </div>
  );
} 