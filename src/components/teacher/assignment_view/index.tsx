import { useState, useCallback, lazy, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { useParams, useNavigate } from "react-router-dom";
import { ASSIGNMENT_STATUS } from "@/constants/assignment-status";
import { UseFormReturn } from "react-hook-form";
import { type AssignmentFormValues } from "@/lib/validations/assignment";
import { TeacherHeader } from "@/components/teacher/assignment_view/TeacherHeader";
import TabSidebar from "@/components/teacher/assignment_view/TeacherSidebar";

import { Loading } from "@/components/ui/loading";
import { Error } from "@/components/ui/error";
import StepContent from "@/components/teacher/assignment_view/StepContent";
import useSingleAssignmentView from "@/hooks/teacher/useSingleAssignmentView";

const ApprovalModal = lazy(
  () => import("@/components/teacher/assignment_view/ApprovalModal")
);

type TeacherAssignmentViewProps = {
  user: User;
};

const tabs = [
  { id: "work", label: "Work details" },
  { id: "feedback", label: "Feedback" }
];

const TeacherAssignmentView = ({ user }: TeacherAssignmentViewProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeSidebarTab, setActiveSidebarTab] =
    useState<(typeof tabs)[number]["id"]>("work");
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] =
    useState<boolean>(false);
  const [modalDefaultValues, setModalDefaultValues] = useState({
    selectedSkills: [] as string[],
    justification: "",
    feedback: ""
  });

  // Use the custom hook for data fetching and management
  const {
    isLoading,
    isRefetching,
    assignment,
    student,
    feedbackItems,
    skillsAssessment,
    form,
    refetchAssignment,
    updateAssignmentStatus,
    setSkillsAssessment,
    getCurrentTeacherLatestFeedback
  } = useSingleAssignmentView(id, user);

  // Set initial modal values based on skills assessment and latest feedback
  useEffect(() => {
    if (skillsAssessment) {
      setModalDefaultValues(prev => ({
        ...prev,
        selectedSkills: skillsAssessment.selected_skills || [],
        justification: skillsAssessment.skills_justification || ""
      }));
    }
  }, [skillsAssessment]);

  // Toggle feedback modal visibility and prepare default values
  const toggleFeedbackModal = useCallback(() => {
    if (!isFeedbackModalOpen) {
      // Modal is about to open - get the latest feedback from current teacher
      const latestFeedback = getCurrentTeacherLatestFeedback();
      
      // Update default values for the modal
      setModalDefaultValues({
        selectedSkills: skillsAssessment?.selected_skills || [],
        justification: skillsAssessment?.skills_justification || "",
        feedback: "" // Always start with empty feedback
      });
    }
    
    setIsFeedbackModalOpen((prevState) => !prevState);
  }, [isFeedbackModalOpen, getCurrentTeacherLatestFeedback, skillsAssessment]);

  if (isLoading || isRefetching) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading />
      </div>
    );
  }

  // Don't attempt to render content if no assignment was loaded
  if (!assignment?.id) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Error
          fullScreen
          title="Assignment Not Found"
          message="The assignment you're looking for doesn't exist or you don't have permission to view it."
          homeButtonText="Return to Dashboard"
          onHome={() => navigate("/app/teacher/dashboard")}
          retryButtonText="Try Again"
          retry={refetchAssignment}
        />
      </div>
    );
  }

  return (
    <div className="px-8 py-5 md:px-16 md:py-10">
      <div className="flex flex-col gap-4 md:gap-8 md:flex-row">
        {/* Sidebar */}
        <TabSidebar
          activeTab={activeSidebarTab}
          setActiveTab={setActiveSidebarTab}
          tabs={tabs}
          title="Work"
        />

        {/* Main content area */}
        <div className="flex-1">
          <div className="rounded border border-slate-200 flex flex-col h-[calc(100vh-8rem)] overflow-hidden shadow-sm bg-white">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200">
              <TeacherHeader
                studentName={student?.name || "Student"}
                subject={assignment.subject || "Unknown Subject"}
                grade={assignment.grade || "Unknown Grade"}
                isApproved={assignment?.status === ASSIGNMENT_STATUS.APPROVED}
                sendFeedback={toggleFeedbackModal}
              />
              
            </div>

            {/* Content based on sidebar tab */}
            <div className="flex-1 overflow-auto">
              <StepContent
                step={activeSidebarTab}
                form={form as UseFormReturn<AssignmentFormValues>}
                feedbackItems={feedbackItems}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {isFeedbackModalOpen ? (
        <ApprovalModal
          isOpen={isFeedbackModalOpen}
          onClose={toggleFeedbackModal}
          onRevision={async (formData) => {
            await updateAssignmentStatus(
              {
                selectedSkills: formData?.selectedSkills || [],
                justification: formData?.justification || "",
                feedback: formData?.feedback || "",
              },
              ASSIGNMENT_STATUS.NEEDS_REVISION
            );
          }}
          onApprove={async (formData) => {
            await updateAssignmentStatus(
              {
                selectedSkills: formData?.selectedSkills || [],
                justification: formData?.justification || "",
                feedback: formData?.feedback || "",
              },
              ASSIGNMENT_STATUS.APPROVED
            );
          }}
          defaultStates={modalDefaultValues}
          onFormDataChange={(formData) => {
            setSkillsAssessment({
              selected_skills: formData?.selectedSkills || [],
              skills_justification: formData?.justification || "",
            });
          }}
        />
      ) : null}
    </div>
  );
};

export default TeacherAssignmentView;
