import { useState, useCallback, memo, useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFormValues } from "@/lib/validations/assignment";
import teacherFeedbackImage from "/teacher-feedback.png";
import { Button } from "@/components/ui/button";
import { ASSIGNMENT_STATUS } from "@/constants/assignment-status";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { formatDate } from "@/utils/teacher-feedback-date-utils";
import { Error } from "@/components/ui/error";

// Interfaces
interface TeacherFeedbackStepProps {
  form: UseFormReturn<AssignmentFormValues>;
}

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

// No Feedback Component (Memoized)
const NoFeedback = memo(() => (
  <div className="flex flex-col items-center justify-center w-full h-full px-4 sm:px-6">
    <img
      src={teacherFeedbackImage}
      alt="Teacher feedback illustration"
      className="w-full max-w-[200px] sm:max-w-[280px] md:max-w-[320px] lg:max-w-[408px] h-auto object-contain"
    />
    <div className="flex flex-col text-center mt-4 sm:mt-6 md:mt-8 lg:mt-10 gap-2">
      <h2 className="text-slate-900 text-base sm:text-lg md:text-xl font-semibold">
        Your work is under review
      </h2>
      <p className="text-slate-500 text-xs sm:text-sm md:text-base max-w-[240px] sm:max-w-[320px] md:max-w-[400px] mx-auto">
        Your work has been submitted and is now being reviewed by your
        teacher. You'll receive feedback soon. Keep an eye on your dashboard for
        updates!
      </p>
    </div>
  </div>
));
NoFeedback.displayName = "NoFeedback";

// Have Feedback Component (Memoized)
const HaveFeedback = memo(
  ({ form }: { form: UseFormReturn<AssignmentFormValues> }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState(false);
    const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(
      null
    );
    const feedbackData = form.getValues().feedback as
      | TeacherFeedbackData
      | undefined;
    const assignmentId = form.getValues().id ?? "";
    const assignmentSubject = form.getValues().subject ?? "";

    // Fetch teacher profile data
    useEffect(() => {
      const fetchTeacherProfile = async () => {
        if (!feedbackData?.teacher_id) {
          // Show toast for missing teacher ID
          toast.info("No teacher information available");
          return;
        }

        setFetchError(false);
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("id, full_name")
            .eq("id", feedbackData.teacher_id)
            .single();

          if (error) {
            setFetchError(true);
            toast.error("Failed to fetch teacher profile");
            throw error;
          }
          if (data) setTeacherProfile(data);
        } catch (error) {
          setFetchError(true);
          console.error("Error fetching teacher profile:", error);
        }
      };

      fetchTeacherProfile();
    }, [feedbackData?.teacher_id]);

    const handleRevision = useCallback(async () => {
      if (!assignmentId) {
        toast.error("Missing assignment ID");
        return;
      }

      // Inform user that process is starting
      toast.loading("Changing assignment status to Draft...");

      setIsLoading(true);
      try {
        const { error } = await supabase
          .from("assignments")
          .update({
            status: ASSIGNMENT_STATUS.DRAFT,
            updated_at: new Date().toISOString(),
          })
          .eq("id", assignmentId);

        if (error) throw error;

        form.setValue("status", ASSIGNMENT_STATUS.DRAFT);
        toast.success("Assignment status changed to Draft");
        window.location.reload();
      } catch (error) {
        console.error("Error updating assignment status:", error);
        toast.error("Failed to update assignment status");
      } finally {
        setIsLoading(false);
      }
    }, [assignmentId, form]);

    if (!feedbackData?.text) {
      toast.error("No feedback text available");
      return null;
    }

    // Use teacher profile data if available, otherwise fallback to default values
    const teacherName = teacherProfile?.full_name || "Unknown Teacher";
    const teacherSubject = assignmentSubject
      ? `${assignmentSubject} Teacher`
      : "Subject Teacher";
    const dateString = formatDate(feedbackData?.date);
    const teacherInitial = teacherName.charAt(0).toUpperCase();

    if (fetchError) {
      return (
        <Error
          showHomeButton={false}
          retry={() => {
            window.location.reload();
          }}
        />
      );
    }

    return (
      <div className="flex flex-col gap-5 md:gap-10">
        <div className="flex flex-col gap-3">
          <h3 className="text-sm sm:text-base font-semibold text-slate-900">
            Reviewed by:
          </h3>
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
          <div className="px-3 py-2 rounded-md border border-slate-300 bg-transparent text-slate-600 text-sm font-normal">
            {feedbackData?.text ? (
              feedbackData.text
            ) : (
              <span className="text-slate-400 italic">
                No feedback provided
              </span>
            )}
          </div>
          {
            form?.getValues("status") === ASSIGNMENT_STATUS.NEEDS_REVISION ? (
              <Button
                onClick={handleRevision}
                className="w-max bg-[#6366F1] hover:bg-[#6366F1]/90 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Make Revision"}
              </Button>
            ):null
          }
        </div>
      </div>
    );
  }
);
HaveFeedback.displayName = "HaveFeedback";

// Main Component
export function TeacherFeedbackStep({ form }: TeacherFeedbackStepProps) {
  const hasFeedback = !!form?.getValues()?.feedback?.text;

  return <>{hasFeedback ? <HaveFeedback form={form} /> : <NoFeedback />}</>;
}
