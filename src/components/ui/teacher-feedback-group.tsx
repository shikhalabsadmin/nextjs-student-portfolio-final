import { useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate } from "@/utils/teacher-feedback-date-utils";
import { TeacherFeedbackData, TeacherProfile } from "@/components/ui/feedback-item";

// Group feedback by teacher
export interface GroupedFeedback {
  teacherId: string;
  feedbackItems: TeacherFeedbackData[];
}

// Props for the TeacherFeedbackCard component
interface TeacherFeedbackCardProps {
  teacherId: string;
  feedbackItems: TeacherFeedbackData[];
  teacherProfile: TeacherProfile | null;
  assignmentSubject: string;
}

// Props for the GroupedTeacherFeedback component
export interface GroupedTeacherFeedbackProps {
  feedbackItems: TeacherFeedbackData[];
  teacherProfiles: Record<string, TeacherProfile>;
  assignmentSubject: string;
}

// Teacher Feedback Card Component (groups all feedback from one teacher)
export const TeacherFeedbackCard = ({ 
  teacherId, 
  feedbackItems, 
  teacherProfile, 
  assignmentSubject 
}: TeacherFeedbackCardProps) => {
  if (!feedbackItems.length) return null;
  
  // Sort feedback items by date (newest first)
  const sortedFeedback = [...feedbackItems].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });
  
  // Get latest feedback for header information
  const latestFeedback = sortedFeedback[0];
  
  // Extract teacher information
  const teacherName = teacherProfile?.full_name || latestFeedback?.teacher_name || "Unknown Teacher";
  const teacherSubject = assignmentSubject
    ? `${assignmentSubject} Teacher`
    : latestFeedback?.subject || "Subject Teacher";
  const teacherInitial = teacherName.charAt(0).toUpperCase();
  
  return (
    <div className="flex flex-col gap-5 m-5 p-5 border border-slate-200 rounded-md shadow-md">
      {/* Teacher profile header */}
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback>{teacherInitial}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col justify-between">
          <p className="font-semibold text-slate-900 text-sm sm:text-base">
            {teacherName}
          </p>
          <p className="text-xs sm:text-sm text-slate-600 font-normal">
            {teacherSubject}
          </p>
        </div>
      </div>
      
      {/* Feedback entries */}
      <div className="space-y-4 pt-2">
        <h3 className="text-sm sm:text-base font-semibold text-slate-900">
          Feedback
        </h3>
        {sortedFeedback.map((feedback, index) => (
          <div key={`${feedback.teacher_id}-${feedback.date}-${index}`} className="space-y-1">
            <div className="text-xs text-slate-500 font-medium">
              {feedback.date ? formatDate(feedback.date) : ''}
            </div>
            {feedback.text ? (
              <div 
                className="px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-slate-600 text-sm font-normal prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: feedback.text }}
              />
            ) : (
              <div className="px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-slate-600 text-sm font-normal">
                <span className="text-slate-400 italic">No feedback text</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper function to group feedback by teacher
export const groupFeedbackByTeacher = (feedbackItems: TeacherFeedbackData[]): GroupedFeedback[] => {
  const feedbackByTeacher: Record<string, TeacherFeedbackData[]> = {};
  
  feedbackItems.forEach(feedback => {
    if (feedback.teacher_id) {
      if (!feedbackByTeacher[feedback.teacher_id]) {
        feedbackByTeacher[feedback.teacher_id] = [];
      }
      feedbackByTeacher[feedback.teacher_id].push(feedback);
    }
  });
  
  // Convert to array format for rendering
  return Object.entries(feedbackByTeacher).map(([teacherId, items]) => ({
    teacherId,
    feedbackItems: items
  }));
};

// Main component that renders grouped feedback
export const GroupedTeacherFeedback = ({ 
  feedbackItems, 
  teacherProfiles, 
  assignmentSubject 
}: GroupedTeacherFeedbackProps) => {
  // Group feedback by teacher
  const groupedFeedback = useMemo(() => 
    groupFeedbackByTeacher(feedbackItems),
  [feedbackItems]);
  
  return (
    <div className="space-y-6">
      {groupedFeedback.map(({ teacherId, feedbackItems }) => (
        <TeacherFeedbackCard
          key={teacherId}
          teacherId={teacherId}
          feedbackItems={feedbackItems}
          teacherProfile={teacherProfiles[teacherId] || null}
          assignmentSubject={assignmentSubject}
        />
      ))}
    </div>
  );
};

export default GroupedTeacherFeedback; 