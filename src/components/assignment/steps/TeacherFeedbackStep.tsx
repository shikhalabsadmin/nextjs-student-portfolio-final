import { useState, useCallback, memo, useEffect, useMemo } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { TeacherFeedbackData as BaseFeedbackData, TeacherProfile } from "@/components/ui/feedback-item";
import { getProfileInfo } from "@/api/profiles";
import { Badge } from "@/components/ui/badge";
import GroupedTeacherFeedback from "@/components/ui/teacher-feedback-group";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/config/routes";
import { useAuthState } from "@/hooks/useAuthState";
import { UserRole } from "@/enums/user.enum";
import { MessageCircle } from "lucide-react";
import { QuestionComment } from "@/lib/validations/assignment";
import { normalizeFeedback, getLatestFeedback, getLatestQuestionComments } from "@/lib/utils/feedback-compatibility";
import { getQuestionLabel } from "@/lib/utils/question-mapping";

// Interfaces
interface TeacherFeedbackStepProps {
  form: UseFormReturn<AssignmentFormValues>;
}

// Extend the TeacherFeedbackData to include skills properties and question comments
interface TeacherFeedbackData extends BaseFeedbackData {
  selected_skills?: string[];
  skills_justification?: string;
  question_comments?: Record<string, QuestionComment>;
}

// Define interface for profile data from API
interface ProfileData {
  id: string;
  full_name?: string;
  [key: string]: string | undefined;
}

// Skills Card Component
const SkillsCard = memo(({ feedback }: { feedback: TeacherFeedbackData }) => {
  if (!feedback?.selected_skills?.length && !feedback?.skills_justification) {
    return null;
  }

  return (
    <div className="flex flex-col gap-5 m-5 p-5 border border-slate-200 rounded-md shadow-md">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Skills Assessment</h3>
      
      {feedback.selected_skills && feedback.selected_skills.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-slate-700 mb-2">Skills Demonstrated</h4>
          <div className="flex flex-wrap gap-2">
            {feedback.selected_skills.map((skill, index) => (
              <Badge 
                key={index}
                className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 px-2.5 py-0.5 text-xs font-medium"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {feedback.skills_justification && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">Justification</h4>
          <div 
            className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-100 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: feedback.skills_justification }}
          />
        </div>
      )}
    </div>
  );
});
 SkillsCard.displayName = "SkillsCard";

// Question Comments Component
const QuestionCommentsCard = memo(({ questionComments }: { questionComments: Record<string, QuestionComment> }) => {
  const commentEntries = Object.entries(questionComments);
  
  if (commentEntries.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 m-5 p-5 border border-blue-200 rounded-md shadow-md bg-blue-50">
      <div className="flex items-center gap-2 mb-2">
        <MessageCircle className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-blue-900">Question Comments</h3>
        <Badge className="bg-blue-100 text-blue-800 text-xs">
          {commentEntries.length}
        </Badge>
      </div>
      
      <div className="space-y-4">
        {commentEntries.map(([questionId, comment]) => (
          <div key={questionId} className="bg-white border border-blue-200 rounded-md p-4">
            <div className="text-sm font-medium text-blue-800 mb-2">
              📝 {getQuestionLabel(questionId)}
            </div>
            <div 
              className="text-gray-700 text-sm mb-2 bg-gray-50 p-3 rounded border prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: comment.comment }}
            />
            <div className="text-xs text-blue-600">
              Teacher feedback • {new Date(comment.timestamp).toLocaleDateString()} at{' '}
              {new Date(comment.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded mt-2">
        💡 These are specific comments your teacher made about individual questions in your assignment
      </div>
    </div>
  );
});
QuestionCommentsCard.displayName = "QuestionCommentsCard";

// No Feedback Component (Memoized)
const NoFeedback = memo(() => {
  const navigate = useNavigate();
  const { user } = useAuthState();
  
  const getHomeRoute = () => {
    if (!user) return ROUTES.COMMON.HOME;
    
    switch (user.role) {
      case UserRole.STUDENT:
        return ROUTES.STUDENT.DASHBOARD;
      case UserRole.TEACHER:
        return ROUTES.TEACHER.DASHBOARD;
      case UserRole.ADMIN:
        return ROUTES.ADMIN.DASHBOARD;
      default:
        return ROUTES.COMMON.HOME;
    }
  };
  
  const handleGoHome = () => {
    navigate(getHomeRoute());
  };

  return (
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
        <div className="mt-4 sm:mt-6 md:mt-8">
          <Button 
            onClick={handleGoHome}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm sm:text-base px-6 py-3 rounded-lg transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-1 duration-200"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
});
NoFeedback.displayName = "NoFeedback";

// Have Feedback Component (Memoized)
const HaveFeedback = memo(
  ({ form }: { form: UseFormReturn<AssignmentFormValues> }) => {
    const feedback = form.getValues().feedback;
    console.log("🔍 COMMENTS DEBUG - TeacherFeedbackStep feedback structure:", feedback);
    if (Array.isArray(feedback) && feedback.length > 0) {
      console.log("🔍 COMMENTS DEBUG - First feedback item:", feedback[0]);
      console.log("🔍 COMMENTS DEBUG - First feedback item keys:", Object.keys(feedback[0]));
      console.log("🔍 COMMENTS DEBUG - Looking for question_comments in first item:", feedback[0].question_comments);
      console.log("🔍 COMMENTS DEBUG - All feedback items:", feedback.map((item, index) => ({ 
        index, 
        keys: Object.keys(item),
        hasQuestionComments: !!item.question_comments,
        questionCommentsKeys: item.question_comments ? Object.keys(item.question_comments) : 'none'
      })));
    }
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuthState();
    
    // Use compatibility utilities to handle both old and new feedback formats
    const feedbackItems = normalizeFeedback(form.getValues().feedback) as TeacherFeedbackData[];
    const assignmentId = form.getValues().id ?? "";
    const assignmentSubject = form.getValues().subject ?? "";

    // Get most recent feedback using compatibility utility
    const mostRecentFeedback = getLatestFeedback(form.getValues().feedback) as TeacherFeedbackData | null;

    // Get unique teacher IDs from all feedback items
    const teacherIds = [...new Set(
      feedbackItems
        .filter(item => item.teacher_id)
        .map(item => item.teacher_id as string)
    )];

    // Fetch teacher profiles data using React Query
    const {
      data: teacherProfiles = {}, 
      isLoading: isLoadingProfiles,
      isError: isErrorProfiles,
      refetch
    } = useQuery({
      queryKey: ['teacher-profiles', teacherIds],
      queryFn: async () => {
        if (teacherIds.length === 0) return {};
        
        try {
          // Fetch each teacher profile using the API function
          const profilePromises = teacherIds.map(id => getProfileInfo(id, ["id", "full_name"]));
          const profiles = await Promise.all(profilePromises);
          
          // Create a map of teacher profiles for easy lookup
          return profiles.reduce((acc, result) => {
            // Make sure data exists and has valid profile data
            if (!result.error && result.data) {
              // First cast to unknown, then to ProfileData
              const profileData = result.data as unknown as ProfileData;
              if (profileData && profileData.id) {
                acc[profileData.id] = profileData as unknown as TeacherProfile;
              }
            }
            return acc;
          }, {} as Record<string, TeacherProfile>);
        } catch (error) {
          console.error("Error fetching teacher profiles:", error);
          toast.error("Failed to fetch teacher profiles");
          throw error;
        }
      },
      enabled: teacherIds.length > 0,
    });

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

    if (feedbackItems.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full p-4 text-center">
          <h2 className="text-slate-900 text-base sm:text-lg font-semibold mb-2">
            No feedback available
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm max-w-md">
            There is no feedback for this assignment yet. Check back later.
          </p>
        </div>
      );
    }

    if (isErrorProfiles) {
      return (
        <Error
          showHomeButton={false}
          retry={() => refetch()}
        />
      );
    }

    // Extract question comments using compatibility utility
    const questionComments = getLatestQuestionComments(form.getValues().feedback);

    return (
      <div className="flex flex-col gap-5">
        {/* Skills Card - showing most recent selected skills */}
        {mostRecentFeedback && (
          mostRecentFeedback.selected_skills?.length > 0 || mostRecentFeedback.skills_justification ? (
            <SkillsCard feedback={mostRecentFeedback} />
          ) : null
        )}
        
        {/* Question Comments Card - showing specific feedback on questions */}
        {questionComments && Object.keys(questionComments).length > 0 && (
          <QuestionCommentsCard questionComments={questionComments} />
        )}
        
        {isLoadingProfiles && teacherIds.length > 0 ? (
          <div className="flex justify-center items-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <GroupedTeacherFeedback
            feedbackItems={feedbackItems}
            teacherProfiles={teacherProfiles}
            assignmentSubject={assignmentSubject}
          />
        )}
        
        {form?.getValues("status") === ASSIGNMENT_STATUS.NEEDS_REVISION && user?.role === UserRole.TEACHER && (
          <Button
            onClick={handleRevision}
            className="w-max bg-[#6366F1] hover:bg-[#6366F1]/90 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Make Revision"}
          </Button>
        )}
      </div>
    );
  }
);
HaveFeedback.displayName = "HaveFeedback";

// Main Component
export function TeacherFeedbackStep({ form }: TeacherFeedbackStepProps) {
  const hasFeedback = !!form?.getValues()?.feedback?.length;

  return <>{hasFeedback ? <HaveFeedback form={form} /> : <NoFeedback />}</>;
}
