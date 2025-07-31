import { FeedbackItem, QuestionComment } from "@/lib/validations/assignment";

// Utility to normalize feedback from any format to the new array format
export function normalizeFeedback(feedback: any): FeedbackItem[] {
  if (!feedback) return [];
  
  // If it's already an array, ensure each item has question_comments
  if (Array.isArray(feedback)) {
    return feedback.map(item => ({
      ...item,
      question_comments: item.question_comments || {}
    }));
  }
  
  // If it's an object (old format), wrap in array and add question_comments
  if (typeof feedback === 'object') {
    return [{
      ...feedback,
      question_comments: feedback.question_comments || {}
    }];
  }
  
  return [];
}

// Get the most recent feedback item
export function getLatestFeedback(feedback: any): FeedbackItem | null {
  const normalized = normalizeFeedback(feedback);
  if (normalized.length === 0) return null;
  
  // Sort by date (newest first) and return the first one
  const sorted = normalized.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });
  
  return sorted[0];
}

// Extract question comments from the latest feedback
export function getLatestQuestionComments(feedback: any): Record<string, QuestionComment> {
  const latest = getLatestFeedback(feedback);
  return latest?.question_comments || {};
}

// Check if feedback has any question comments
export function hasQuestionComments(feedback: any): boolean {
  const comments = getLatestQuestionComments(feedback);
  return Object.keys(comments).length > 0;
}

// Create new feedback item with question comments
export function createFeedbackItem(
  teacherId: string,
  selectedSkills: string[],
  skillsJustification: string,
  generalFeedback: string,
  questionComments: Record<string, QuestionComment>
): FeedbackItem {
  return {
    text: generalFeedback,
    date: new Date().toISOString(),
    teacher_id: teacherId,
    selected_skills: selectedSkills,
    skills_justification: skillsJustification,
    question_comments: questionComments,
  };
} 