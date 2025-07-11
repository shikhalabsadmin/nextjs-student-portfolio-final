import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, RefreshCw } from "lucide-react";

interface TeacherHeaderProps {
  studentName: string;
  subject: string;
  grade: string;
  isApproved: boolean;
  isRevisionRequested?: boolean;
  onApprove?: () => void;
  onRequestRevision?: () => void;
  showActionButtons?: boolean;
}

export const TeacherHeader = ({
  studentName,
  subject,
  grade,
  isApproved,
  isRevisionRequested = false,
  onApprove,
  onRequestRevision,
  showActionButtons = true,
}: TeacherHeaderProps) => {
  // Determine status badge
  const renderStatusBadge = () => {
    if (isApproved) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs font-medium px-2 py-1">
          Approved
        </Badge>
      );
    }
    
    if (isRevisionRequested) {
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs font-medium px-2 py-1">
          Revision Requested
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-slate-100 text-slate-800 border-slate-200 text-xs font-medium px-2 py-1">
        Pending Review
      </Badge>
    );
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 md:p-6 border-b border-slate-200 bg-white">
      <div className="flex flex-col mb-3 sm:mb-0 w-full sm:w-auto">
        <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-3">
          <h1 className="text-sm sm:text-base font-semibold text-slate-900 break-words">
            {studentName || "Unknown Student"}
          </h1>
          <div className="mt-1 sm:mt-0">{renderStatusBadge()}</div>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 break-words mt-1">
          {grade ? `Class ${grade}` : "No Class"} • {subject || "No Subject"}
        </p>
      </div>

      {/* Action Buttons */}
      {showActionButtons && !isApproved && !isRevisionRequested && (
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onRequestRevision}
            className="flex-1 sm:flex-none"
            disabled={!onRequestRevision}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Request Revision
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onApprove}
            className="flex-1 sm:flex-none bg-[#6366F1] hover:bg-[#6366F1]/90 text-white"
            disabled={!onApprove}
          >
            <Check className="mr-1.5 h-3.5 w-3.5" />
            Approve
          </Button>
        </div>
      )}
    </div>
  );
};