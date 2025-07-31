import React, { ReactNode } from "react";
import { QuestionCommentWidget } from "./question-comment-widget";
import { QuestionComment } from "@/lib/validations/assignment";
import { cn } from "@/lib/utils";

interface FormFieldWithCommentProps {
  questionId: string;
  label?: ReactNode;
  children: ReactNode;
  existingComment?: QuestionComment | undefined;
  onCommentSave: (questionId: string, comment: string) => void;
  onCommentDelete?: (questionId: string) => void;
  disabled?: boolean;
  className?: string;
  showCommentWidget?: boolean; // Allow hiding comment widget when needed
}

export const FormFieldWithComment: React.FC<FormFieldWithCommentProps> = ({
  questionId,
  label,
  children,
  existingComment,
  onCommentSave,
  onCommentDelete,
  disabled = false,
  className,
  showCommentWidget = true,
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Field Label with Comment Widget */}
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-900">
            {label}
          </label>
          {showCommentWidget && (
            <QuestionCommentWidget
              questionId={questionId}
              existingComment={existingComment || undefined}
              onCommentSave={onCommentSave}
              onCommentDelete={onCommentDelete}
              disabled={disabled}
            />
          )}
        </div>
      )}

      {/* Form Field Content */}
      <div className="relative">
        {children}
        
        {/* Show existing comment indicator if no label but has comment */}
        {!label && showCommentWidget && existingComment && (
          <div className="absolute -top-2 -right-2">
            <QuestionCommentWidget
              questionId={questionId}
              existingComment={existingComment}
              onCommentSave={onCommentSave}
              onCommentDelete={onCommentDelete}
              disabled={disabled}
              className="h-6 w-6"
            />
          </div>
        )}

        {/* Floating comment widget for fields without labels */}
        {!label && showCommentWidget && !existingComment && (
          <div className="absolute top-2 right-2">
            <QuestionCommentWidget
              questionId={questionId}
              existingComment={existingComment}
              onCommentSave={onCommentSave}
              onCommentDelete={onCommentDelete}
              disabled={disabled}
              className="h-6 w-6 opacity-60 hover:opacity-100"
            />
          </div>
        )}
      </div>

      {/* Display existing comment below field if present */}
      {existingComment && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="text-blue-900 font-medium mb-1">Teacher Comment:</div>
              <div className="text-blue-800">{existingComment.comment}</div>
              <div className="text-blue-600 text-xs mt-1">
                {new Date(existingComment.timestamp).toLocaleDateString()} at{' '}
                {new Date(existingComment.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 