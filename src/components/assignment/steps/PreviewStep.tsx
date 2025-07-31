import { useMemo, useState } from "react";
import { PreviewStepProps } from "@/lib/types/preview";
import { Maximize2, MessageCircle, AlertCircle } from "lucide-react";
import { SKILLS } from "@/constants";
import { ASSIGNMENT_STATUS } from "@/constants/assignment-status";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AssignmentPreview } from "@/components/preview";
import { getQuestionLabel } from "@/lib/utils/question-mapping";
import { getLatestQuestionComments } from "@/lib/utils/feedback-compatibility";

export function PreviewStep({ form }: PreviewStepProps) {
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const values = useMemo(() => form.getValues(), [form]);

  const selectedSkills = useMemo(
    () =>
      (values?.selected_skills
        ?.map((id) => SKILLS.find((s) => s.id === id)?.name)
        .filter(Boolean) as string[]) || [],
    [values?.selected_skills]
  );

  // Extract teacher question comments for revision mode
  const questionComments = useMemo(() => {
    if (values?.status !== ASSIGNMENT_STATUS.NEEDS_REVISION) {
      return null;
    }
    
    // Use the proper utility function to extract question comments
    const comments = getLatestQuestionComments(values?.feedback);
    const commentEntries = Object.entries(comments);
    
    return commentEntries.length > 0 ? commentEntries : null;
  }, [values?.feedback, values?.status]);

  // Get the latest image file where is_process_documentation is false to use as banner
  const mainImage = useMemo(() => {
    if (!values?.files?.length) return null;

    // Find the latest non-process image file
    const imageFile = [...(values.files || [])]
      .reverse()
      .find((file) => {
        if (!file) return false;
        // Filter for non-process documentation images
        if (file.is_process_documentation === true) return false;
        // Check if it's an image file
        const fileUrl = typeof file === "string" ? file : file?.file_url;
        return fileUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl);
      });

    return typeof imageFile === "string"
      ? imageFile
      : imageFile?.file_url || null;
  }, [values?.files]);

  const handleToggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <div className="relative">
      <div className="flex flex-row justify-between items-center mb-4">
        <h2 className="text-lg md:text-xl font-semibold text-slate-900">
          Your Assignment
        </h2>
        <Button
          variant="outline"
          onClick={handleToggleFullScreen}
          className="px-2 py-1 md:px-4 md:py-2 flex items-center gap-2.5 text-base text-slate-800 font-medium"
          size="sm"
        >
          <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span>Full screen</span>
        </Button>
      </div>

      {/* Teacher Comments Summary for Revision Mode */}
      {questionComments && (
        <div className="mb-6 p-4 border border-amber-200 rounded-lg bg-amber-50">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-amber-900">
              Teacher Feedback - What to Address
            </h3>
            <Badge className="bg-amber-100 text-amber-800 text-xs">
              {questionComments.length} comment{questionComments.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          
          <div className="space-y-3">
            {questionComments.map(([questionId, comment]) => (
              <div key={questionId} className="bg-white border border-amber-200 rounded-md p-3">
                <div className="text-sm font-medium text-amber-800 mb-2">
                  📝 {getQuestionLabel(questionId)}
                </div>
                <div className="text-gray-700 text-sm bg-gray-50 p-3 rounded border">
                  {comment.comment}
                </div>
                <div className="text-xs text-amber-600 mt-2">
                  Teacher feedback • {new Date(comment.timestamp).toLocaleDateString()} at{' '}
                  {new Date(comment.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-sm text-amber-700 bg-amber-100 p-3 rounded mt-4">
            💡 <strong>Review these comments</strong> and make sure you've addressed each point before resubmitting your assignment.
          </div>
        </div>
      )}

      <AssignmentPreview
        values={values}
        selectedSkills={selectedSkills}
        mainImage={mainImage}
        isFullScreen={isFullScreen}
        onClose={() => setIsFullScreen(false)}
      />
    </div>
  );
}