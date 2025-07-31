import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFormValues } from "@/lib/validations/assignment";
import { SkillsSelection } from "./SkillsSelection";
import { SkillsJustification } from "./SkillsJustification";
import { PrideReason } from "./PrideReason";
import { FormFieldWithComment } from "@/components/ui/form-field-with-comment";
import { useQuestionCommentsContext } from "@/components/teacher/assignment_view/step-component/work";

interface ProcessStepWithCommentsProps {
  form: UseFormReturn<AssignmentFormValues>;
  isTeacherView?: boolean;
}

export function ProcessStepWithComments({ form, isTeacherView = false }: ProcessStepWithCommentsProps) {
  const questionComments = isTeacherView ? useQuestionCommentsContext() : null;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Skills Selection with Comments */}
      <FormFieldWithComment
        questionId="selected_skills"
        label="Skills Assessment"
        existingComment={questionComments?.getComment("selected_skills")}
        onCommentSave={questionComments?.addComment || (() => {})}
        onCommentDelete={questionComments?.removeComment}
        showCommentWidget={isTeacherView}
        disabled={!isTeacherView}
      >
        <SkillsSelection form={form} />
      </FormFieldWithComment>

      {/* Skills Justification with Comments */}
      <FormFieldWithComment
        questionId="skills_justification"
        label="Skills Justification"
        existingComment={questionComments?.getComment("skills_justification")}
        onCommentSave={questionComments?.addComment || (() => {})}
        onCommentDelete={questionComments?.removeComment}
        showCommentWidget={isTeacherView}
        disabled={!isTeacherView}
      >
        <SkillsJustification form={form} />
      </FormFieldWithComment>

      {/* Pride Reason with Comments */}
      <FormFieldWithComment
        questionId="pride_reason"
        label="What makes you proud"
        existingComment={questionComments?.getComment("pride_reason")}
        onCommentSave={questionComments?.addComment || (() => {})}
        onCommentDelete={questionComments?.removeComment}
        showCommentWidget={isTeacherView}
        disabled={!isTeacherView}
      >
        <PrideReason form={form} />
      </FormFieldWithComment>
    </div>
  );
} 