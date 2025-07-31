import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { AssignmentFormValues } from "@/lib/validations/assignment";
import { CreationProcess } from "./reflection-sections/CreationProcess";
import { Learnings } from "./reflection-sections/Learnings";
import { Challenges } from "./reflection-sections/Challenges";
import { Improvements } from "./reflection-sections/Improvements";
import { Acknowledgments } from "./reflection-sections/Acknowledgments";
import { CreationProcessImages } from "./reflection-sections/CreationProcessImages";
import { FormFieldWithComment } from "@/components/ui/form-field-with-comment";
import { useQuestionComments } from "@/hooks/useQuestionComments";

// Helper function to get text content from HTML
const getTextContent = (html: string): string => {
  if (!html || html === '<p></p>') return '';
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
};

interface ReflectionStepWithCommentsProps {
  form: UseFormReturn<AssignmentFormValues>;
  isTeacherView?: boolean;
}

export function ReflectionStepWithComments({ form, isTeacherView = false }: ReflectionStepWithCommentsProps) {
  // For now, we'll pass a placeholder teacherId since we don't have access to it in this context
  // In a real implementation, this would come from the teacher's session/context
  const questionComments = isTeacherView ? useQuestionComments({
    teacherId: "placeholder-teacher-id", // This should come from teacher context/session
    existingComments: {},
    onCommentsChange: () => {}
  }) : null;
  
  // Track character counts for each field (text-only, not HTML)
  const [charCounts, setCharCounts] = useState({
    creation_process: getTextContent(form.getValues("creation_process") || '').length,
    learnings: getTextContent(form.getValues("learnings") || '').length,
    challenges: getTextContent(form.getValues("challenges") || '').length,
    improvements: getTextContent(form.getValues("improvements") || '').length,
    acknowledgments: getTextContent(form.getValues("acknowledgments") || '').length,
  });

  // Update character counts when form values change
  useEffect(() => {
    const subscription = form.watch((value) => {
      setCharCounts({
        creation_process: getTextContent(value.creation_process || '').length,
        learnings: getTextContent(value.learnings || '').length,
        challenges: getTextContent(value.challenges || '').length,
        improvements: getTextContent(value.improvements || '').length,
        acknowledgments: getTextContent(value.acknowledgments || '').length,
      });
    });

    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Creation Process with Comments */}
      <FormFieldWithComment
        questionId="creation_process"
        label="Creation Process"
        existingComment={questionComments?.getComment("creation_process")}
        onCommentSave={questionComments?.addComment || (() => {})}
        onCommentDelete={questionComments?.removeComment}
        showCommentWidget={isTeacherView}
        disabled={!isTeacherView}
      >
        <CreationProcess form={form} currentLength={charCounts.creation_process} />
      </FormFieldWithComment>

      {/* Creation Process Images - No comments needed for file uploads */}
      <CreationProcessImages form={form} />

      {/* Learnings with Comments */}
      <FormFieldWithComment
        questionId="learnings"
        label="What you learned"
        existingComment={questionComments?.getComment("learnings")}
        onCommentSave={questionComments?.addComment || (() => {})}
        onCommentDelete={questionComments?.removeComment}
        showCommentWidget={isTeacherView}
        disabled={!isTeacherView}
      >
        <Learnings form={form} currentLength={charCounts.learnings} />
      </FormFieldWithComment>

      {/* Challenges with Comments */}
      <FormFieldWithComment
        questionId="challenges"
        label="Challenges faced"
        existingComment={questionComments?.getComment("challenges")}
        onCommentSave={questionComments?.addComment || (() => {})}
        onCommentDelete={questionComments?.removeComment}
        showCommentWidget={isTeacherView}
        disabled={!isTeacherView}
      >
        <Challenges form={form} currentLength={charCounts.challenges} />
      </FormFieldWithComment>

      {/* Improvements with Comments */}
      <FormFieldWithComment
        questionId="improvements"
        label="What would you improve"
        existingComment={questionComments?.getComment("improvements")}
        onCommentSave={questionComments?.addComment || (() => {})}
        onCommentDelete={questionComments?.removeComment}
        showCommentWidget={isTeacherView}
        disabled={!isTeacherView}
      >
        <Improvements form={form} currentLength={charCounts.improvements} />
      </FormFieldWithComment>

      {/* Acknowledgments with Comments */}
      <FormFieldWithComment
        questionId="acknowledgments"
        label="Acknowledgments"
        existingComment={questionComments?.getComment("acknowledgments")}
        onCommentSave={questionComments?.addComment || (() => {})}
        onCommentDelete={questionComments?.removeComment}
        showCommentWidget={isTeacherView}
        disabled={!isTeacherView}
      >
        <Acknowledgments form={form} currentLength={charCounts.acknowledgments} />
      </FormFieldWithComment>
    </div>
  );
} 