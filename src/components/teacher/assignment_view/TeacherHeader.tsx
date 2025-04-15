import { Button } from "@/components/ui/button";

interface TeacherHeaderProps {
  studentName?: string;
  subject?: string;
  grade?: string;
  isApproved: boolean;
  sendFeedback: () => void;
}

export const TeacherHeader = ({
  studentName,
  subject,
  grade,
  isApproved,
  sendFeedback,
}: TeacherHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 md:p-6 border-b border-slate-200 bg-white">
      <div className="flex flex-col mb-3 sm:mb-0 w-full sm:w-auto">
        <h1 className="text-sm sm:text-base font-semibold text-slate-900 break-words">
          {studentName || "Unknown Student"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 break-words">
          {grade ? `Class ${grade}` : "No Class"} • {subject || "No Subject"}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap w-full sm:w-auto gap-2 sm:gap-3 md:gap-6">
        {!isApproved && (
          <Button
          className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-[6px]"
          onClick={sendFeedback}
        >
          Send Feedback
        </Button>
        )}
      </div>
    </div>
  );
};