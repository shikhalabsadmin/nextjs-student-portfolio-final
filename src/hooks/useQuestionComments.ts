import { useState, useCallback, useMemo } from "react";
import { QuestionComment } from "@/lib/validations/assignment";
import { nanoid } from "nanoid";

interface UseQuestionCommentsProps {
  teacherId: string;
  existingComments?: Record<string, QuestionComment>;
  onCommentsChange?: (comments: Record<string, QuestionComment>) => void;
}

export const useQuestionComments = ({ 
  teacherId, 
  existingComments = {}, 
  onCommentsChange 
}: UseQuestionCommentsProps) => {
  const [comments, setComments] = useState<Record<string, QuestionComment>>(existingComments);

  // Add or update a comment for a specific question
  const addComment = useCallback((questionId: string, commentText: string) => {
    console.log('[useQuestionComments] Adding comment:', { questionId, commentText, teacherId });
    
    const newComment: QuestionComment = {
      id: nanoid(),
      comment: commentText,
      timestamp: new Date().toISOString(),
      teacher_id: teacherId,
      question_id: questionId,
    };

    const updatedComments = {
      ...comments,
      [questionId]: newComment,
    };

    console.log('[useQuestionComments] Updated comments:', updatedComments);
    setComments(updatedComments);
    onCommentsChange?.(updatedComments);
  }, [comments, teacherId, onCommentsChange]);

  // Remove a comment for a specific question
  const removeComment = useCallback((questionId: string) => {
    const updatedComments = { ...comments };
    delete updatedComments[questionId];

    setComments(updatedComments);
    onCommentsChange?.(updatedComments);
  }, [comments, onCommentsChange]);

  // Get comment for a specific question
  const getComment = useCallback((questionId: string): QuestionComment | undefined => {
    return comments[questionId];
  }, [comments]);

  // Get all comments as an array
  const allComments = useMemo(() => {
    return Object.values(comments);
  }, [comments]);

  // Check if there are any comments
  const hasComments = useMemo(() => {
    return Object.keys(comments).length > 0;
  }, [comments]);

  // Get count of comments
  const commentsCount = useMemo(() => {
    return Object.keys(comments).length;
  }, [comments]);

  // Get a summary of all comments for final feedback
  const getCommentsSummary = useCallback(() => {
    return Object.entries(comments).map(([questionId, comment]) => ({
      questionId,
      comment: comment.comment,
      timestamp: comment.timestamp,
    }));
  }, [comments]);

  // Sync with external changes (e.g., from parent component)
  const syncComments = useCallback((newComments: Record<string, QuestionComment>) => {
    setComments(newComments);
  }, []);

  return {
    comments,
    addComment,
    removeComment,
    getComment,
    allComments,
    hasComments,
    commentsCount,
    getCommentsSummary,
    syncComments,
  };
}; 