import { UseFormReturn } from "react-hook-form";
import { AssignmentFormValues } from "@/lib/validations/assignment";
import { Error } from "@/components/ui/error";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { TeacherFeedbackData, TeacherProfile } from "@/components/ui/feedback-item";
import { getProfileInfo } from "@/api/profiles";
import { TEACHER_KEYS } from "@/query-key/teacher";
import GroupedTeacherFeedback from "@/components/ui/teacher-feedback-group";

interface FeedbackProps {
  form: UseFormReturn<AssignmentFormValues>;
  feedbackItems?: TeacherFeedbackData[];
}

// Define interface for profile data from API
interface ProfileData {
  id: string;
  full_name?: string;
  [key: string]: string | undefined;
}

// Fetch teacher profiles function for React Query
const fetchTeacherProfiles = async (teacherIds: string[]): Promise<Record<string, TeacherProfile>> => {
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
};

const Feedback = ({ form, feedbackItems = [] }: FeedbackProps) => {
  const assignmentSubject = form.getValues().subject ?? "";
  
  // Get unique teacher IDs from all feedback items
  const teacherIds = [...new Set(
    feedbackItems
      .filter(item => item.teacher_id)
      .map(item => item.teacher_id as string)
  )];
  
  // Use React Query to fetch teacher profiles
  const { 
    data: teacherProfiles = {}, 
    isLoading: isLoadingProfiles, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: TEACHER_KEYS.profiles(teacherIds),
    queryFn: () => fetchTeacherProfiles(teacherIds),
    enabled: teacherIds?.length > 0,
  });

  if (isError) {
    return (
      <Error
        showHomeButton={false}
        retry={() => refetch()}
      />
    );
  }

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

  return (
    <div className="flex flex-col mb-10">
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
    </div>
  );
};

export default Feedback;