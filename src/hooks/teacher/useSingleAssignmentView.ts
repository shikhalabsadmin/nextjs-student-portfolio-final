import { AssignmentFormValues, FeedbackItem } from "@/lib/validations/assignment";
import { StudentProfile } from "@/types/student-dashboard";
import { User } from "@supabase/supabase-js";
import { useMemo, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ToastService } from "@/lib/services/toast.service";
import { ASSIGNMENT_STATUS } from "@/constants/assignment-status";
import { ROUTES } from "@/config/routes";
// Import API functions
import { getAssignmentWithFiles, updateAssignment } from "@/lib/api/assignments";
import { getProfileInfo } from "@/api/profiles";
import {
  TeacherFeedbackItem,
  SkillsAssessment,
  ExtendedAssignmentFormValues,
} from "@/types/teacher/hooks/useSingleAssignmentView";
import { TEACHER_KEYS } from "@/query-key/teacher";

// Combined feedback item with skills assessment
type ExtendedFeedbackItem = FeedbackItem;

const useSingleAssignmentView = (assignmentId: string | undefined, user: User) => {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [feedbackItems, setFeedbackItems] = useState<ExtendedFeedbackItem[]>([]);
  const [skillsAssessment, setSkillsAssessment] = useState<SkillsAssessment>({
    selected_skills: [],
    skills_justification: "",
  });

  const toast = useMemo(() => new ToastService(), []);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<AssignmentFormValues>({
    defaultValues: { status: ASSIGNMENT_STATUS.SUBMITTED },
    mode: "onSubmit",
  });

  // Get the current user's most recent feedback
  const getCurrentTeacherLatestFeedback = useCallback(() => {
    const teacherFeedback = feedbackItems.filter(item => item.teacher_id === user?.id);
    const sortedFeedback = [...teacherFeedback].sort((a, b) => {
      return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
    });
    
    return sortedFeedback[0] || null;
  }, [feedbackItems, user?.id]);

  // Helper to normalize feedback data
  const normalizeFeedback = useCallback((data: ExtendedAssignmentFormValues): ExtendedFeedbackItem[] => {
    // Handle array format
    if (Array.isArray(data.feedback)) {
      return [...data.feedback] as ExtendedFeedbackItem[];
    }
    
    // Handle legacy format (single feedback object)
    if (data.feedback && typeof data.feedback === 'object') {
      const legacyFeedback = data.feedback as unknown as Record<string, unknown>;
      if (legacyFeedback.text) {
        return [{
          text: legacyFeedback.text as string,
          date: (legacyFeedback.date as string) || data.updated_at,
          teacher_id: legacyFeedback.teacher_id as string | null,
          selected_skills: Array.isArray(legacyFeedback.selected_skills) ? (legacyFeedback.selected_skills as string[]) : [],
          skills_justification: typeof legacyFeedback.skills_justification === "string" ? legacyFeedback.skills_justification : "",
        }];
      }
    }
    
    return [];
  }, []);

  // Fetch assignment data
  const {
    data: assignment,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<ExtendedAssignmentFormValues | null>({
    queryKey: assignmentId ? TEACHER_KEYS.assignmentView(assignmentId) : ['teacher', 'assignment', 'undefined'],
    queryFn: async () => {
      if (!assignmentId) return null;

      try {
        const data = await getAssignmentWithFiles(assignmentId);
        
        if (!data) {
          toast.error("Error while loading student assignment");
          return null;
        }

        // Fetch student profile if needed
        if (data.student_id) {
          const studentResponse = await getProfileInfo(data.student_id);
          
          if (!studentResponse.error && studentResponse.data) {
            // Cast to unknown first to satisfy the TypeScript compiler
            setStudent(studentResponse.data as unknown as StudentProfile);
          } else {
            console.error("Student profile error:", studentResponse.message);
            toast.error("Error while loading student profile");
          }
        }

        // Reset form with assignment data
        form.reset(data, { keepDefaultValues: true, keepDirty: false });

        // Process feedback
        const allFeedback = normalizeFeedback(data);
        
        // Sort by date (newest first)
        allFeedback.sort((a, b) => {
          return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
        });
        
        setFeedbackItems(allFeedback);
        
        // Extract skills from most recent feedback
        const latestFeedback = allFeedback[0];
        if (latestFeedback) {
          setSkillsAssessment({
            selected_skills: Array.isArray(latestFeedback.selected_skills) ? latestFeedback.selected_skills : [],
            skills_justification: typeof latestFeedback.skills_justification === "string" ? latestFeedback.skills_justification : "",
          });
        }

        return data;
      } catch (error) {
        console.error("Error fetching assignment:", error);
        toast.error("Failed to load assignment data");
        return null;
      }
    },
    enabled: !!assignmentId,
  });

  // Mutation to update assignment
  const mutation = useMutation({
    mutationFn: async ({
      selectedSkills,
      justification,
      feedback,
      assignmentStatus,
    }: {
      selectedSkills: string[];
      justification: string;
      feedback?: string;
      assignmentStatus: keyof typeof ASSIGNMENT_STATUS;
    }) => {
      if (!assignment?.id) return;

      // Create new feedback item
      const newFeedbackItem: ExtendedFeedbackItem = {
        text: feedback || "",
        date: new Date().toISOString(),
        teacher_id: user?.id || null,
        selected_skills: selectedSkills,
        skills_justification: justification,
      };

      // Combine with existing feedback
      const allFeedback = [newFeedbackItem, ...feedbackItems];

      try {
        // Update the assignment using the API function
        await updateAssignment(assignment.id, {
          status: assignmentStatus,
          feedback: allFeedback,
          ...(assignmentStatus === ASSIGNMENT_STATUS.APPROVED && {
            verified_at: new Date().toISOString()
          }),
        });

        return {
          feedbackItems: allFeedback,
          newSkillsAssessment: {
            selected_skills: selectedSkills,
            skills_justification: justification,
          }
        };
      } catch (error) {
        console.error("Error updating assignment:", error);
        throw new Error("Failed to update assignment");
      }
    },
    onSuccess: ({ feedbackItems: newFeedbackItems, newSkillsAssessment }) => {
      toast.success("Assignment updated successfully");
      setFeedbackItems(newFeedbackItems);
      setSkillsAssessment(newSkillsAssessment);
      queryClient.invalidateQueries({ queryKey: assignmentId ? TEACHER_KEYS.assignmentView(assignmentId) : ['teacher', 'assignment', 'undefined'] });
      navigate(ROUTES.TEACHER.DASHBOARD);
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to update assignment");
    },
  });

  // Update assignment status
  const updateAssignmentStatus = useCallback(
    (
      data: {
        selectedSkills: string[];
        justification: string;
        feedback?: string;
      },
      assignmentStatus: keyof typeof ASSIGNMENT_STATUS
    ) => {
      mutation.mutate({
        ...data,
        assignmentStatus
      });
    },
    [mutation]
  );

  return {
    isLoading,
    isRefetching,
    assignment,
    student,
    feedbackItems,
    skillsAssessment,
    form,
    toast,
    refetchAssignment: refetch,
    updateAssignmentStatus,
    isUpdating: mutation.isPending,
    setFeedbackItems,
    setSkillsAssessment,
    getCurrentTeacherLatestFeedback,
  };
};

export default useSingleAssignmentView;
