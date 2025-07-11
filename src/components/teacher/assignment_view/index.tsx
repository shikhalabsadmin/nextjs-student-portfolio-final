import { useState, useCallback, lazy, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { useParams, useNavigate } from "react-router-dom";
import { ASSIGNMENT_STATUS } from "@/constants/assignment-status";
import { UseFormReturn } from "react-hook-form";
import { type AssignmentFormValues } from "@/lib/validations/assignment";
import { TeacherHeader } from "@/components/teacher/assignment_view/TeacherHeader";
import TeacherSidebar from "@/components/teacher/assignment_view/TeacherSidebar";
import { Loading } from "@/components/ui/loading";
import { Error } from "@/components/ui/error";
import StepContent from "@/components/teacher/assignment_view/StepContent";
import useSingleAssignmentView from "@/hooks/teacher/useSingleAssignmentView";
import { ApprovalModal } from "@/components/teacher/assignment_view/ApprovalModal";
import { RevisionModal } from "@/components/teacher/assignment_view/RevisionModal";

type TeacherAssignmentViewProps = {
  user: User;
};

const TeacherAssignmentView = ({ user }: TeacherAssignmentViewProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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

  // Prepare steps for the sidebar
  const steps = [
    { id: "basic-info", title: "Basic Information", completed: true },
    { id: "files", title: "Files & Links", completed: true },
    { id: "reflection", title: "Reflection", completed: true },
  ];

  // Handle approval modal
  const openApprovalModal = () => setIsApprovalModalOpen(true);
  const closeApprovalModal = () => setIsApprovalModalOpen(false);

  // Handle revision modal
  const openRevisionModal = () => setIsRevisionModalOpen(true);
  const closeRevisionModal = () => setIsRevisionModalOpen(false);

  // Handle step change
  const handleStepChange = (step: number) => {
    setActiveStep(step);
    setIsMobileMenuOpen(false); // Close mobile menu when changing steps
  };

  // Handle back button
  const handleBack = () => {
    navigate("/app/teacher/dashboard");
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

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

  const isApproved = assignment?.status === ASSIGNMENT_STATUS.APPROVED;
  const isRevisionRequested = assignment?.status === ASSIGNMENT_STATUS.NEEDS_REVISION;

  return (
    <div className="px-3 py-3 sm:px-5 sm:py-4 md:px-8 md:py-6 lg:px-16 lg:py-10">
      {/* Mobile menu toggle button */}
      <div className="md:hidden mb-3">
        <button 
          onClick={toggleMobileMenu}
          className="flex items-center justify-center p-2 rounded-md bg-white border border-slate-200 shadow-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
          <span className="ml-2">Assignment Steps</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:gap-4 lg:gap-8">
        {/* Sidebar - hidden on mobile unless toggled */}
        <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block z-20`}>
          <TeacherSidebar
            steps={steps}
            activeStep={activeStep}
            onStepChange={handleStepChange}
            onBack={handleBack}
            showBackButton={true}
          />
        </div>

        {/* Main content area */}
        <div className="flex-1">
          <div className="rounded border border-slate-200 flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)] overflow-hidden shadow-sm bg-white">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200">
              <TeacherHeader
                studentName={student?.name || "Student"}
                subject={assignment.subject || "Unknown Subject"}
                grade={assignment.grade || "Unknown Grade"}
                isApproved={isApproved}
                isRevisionRequested={isRevisionRequested}
              />
            </div>

            {/* Content */}
            <StepContent
              activeStep={activeStep}
              steps={steps}
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
              defaultStates={modalDefaultValues}
              onFormDataChange={(formData) => {
                setSkillsAssessment({
                  selected_skills: formData?.selectedSkills || [],
                  skills_justification: formData?.justification || "",
                });
              }}
              isApproved={isApproved}
              isRevisionRequested={isRevisionRequested}
              form={form as UseFormReturn<AssignmentFormValues>}
              feedbackItems={feedbackItems}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherAssignmentView;
