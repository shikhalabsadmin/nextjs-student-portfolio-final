import React from 'react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate } from "@/utils/teacher-feedback-date-utils";

interface TeacherFeedbackData {
  teacher_name?: string;
  subject?: string;
  date?: string;
  text?: string;
  teacher_id?: string;
}

interface TeacherProfile {
  id: string;
  full_name: string;
}

interface FeedbackItemProps {
  feedback: TeacherFeedbackData;
  assignmentSubject: string;
  teacherProfile?: TeacherProfile | null;
}

const FeedbackItem = ({ 
  feedback, 
  assignmentSubject,
  teacherProfile
}: FeedbackItemProps) => {
  if (!feedback?.text) {
    return null;
  }

  // Use teacher profile data if available, otherwise fallback to default values
  const teacherName = teacherProfile?.full_name || feedback?.teacher_name || "Unknown Teacher";
  const teacherSubject = assignmentSubject
    ? `${assignmentSubject} Teacher`
    : feedback?.subject || "Subject Teacher";
  const dateString = formatDate(feedback?.date);
  const teacherInitial = teacherName.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col gap-5 md:gap-10 m-5 p-5 border border-slate-200  rounded-md shadow-md">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{teacherInitial}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col justify-between">
            <p className="font-semibold text-slate-900 text-sm sm:text-base">
              {teacherName}{" "}
              <span className="text-xs md:text-sm font-normal">
                on {dateString}
              </span>
            </p>
            <p className="text-xs sm:text-sm text-slate-600 font-normal">
              {teacherSubject}
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <h3 className="text-sm sm:text-base font-semibold text-slate-900">
          Feedback
        </h3>
        <div className="bg-transparent text-slate-600 text-sm font-normal text-wrap">
          {feedback?.text ? (
            feedback.text
          ) : (
            <span className="text-slate-400 italic">
              No feedback provided
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export { FeedbackItem, type FeedbackItemProps, type TeacherFeedbackData, type TeacherProfile }; 