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
    feedback: "",
    questionComments: {} as Record<string, any>
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

  // Log assignment data when it changes
  useEffect(() => {

  }, [assignment]);

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

  // Load question comments from latest feedback
  useEffect(() => {
    const latestFeedback = getCurrentTeacherLatestFeedback();
    if (latestFeedback?.question_comments) {

      setModalDefaultValues(prev => ({
        ...prev,
        questionComments: latestFeedback.question_comments || {}
      }));
    }
  }, [feedbackItems, getCurrentTeacherLatestFeedback]);

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
    navigate("/teacher");
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Handle form data change
  const handleFormDataChange = (formData: any) => {

    if (formData) {
      setSkillsAssessment({
        selected_skills: formData.selectedSkills || [],
        skills_justification: formData.justification || "",
      });
      
      // Update modal default values to include question comments
      setModalDefaultValues(prev => {
        const newModalValues = {
          ...prev,
          selectedSkills: formData.selectedSkills || prev.selectedSkills,
          justification: formData.justification || prev.justification,
          feedback: formData.feedback || prev.feedback,
          questionComments: formData.questionComments || prev.questionComments
        };

        return newModalValues;
      });
    }
  };

  // Handle approve action
  const handleApprove = () => {

    openApprovalModal();
  };

  // Handle request revision action
  const handleRequestRevision = () => {

    openRevisionModal();
  };

  // Handle approval submission
  const handleApprovalSubmit = async (formData: any) => {

    await updateAssignmentStatus(
      {
        selectedSkills: formData?.selectedSkills || [],
        justification: formData?.justification || "",
        feedback: formData?.feedback || "",
        questionComments: modalDefaultValues?.questionComments || {},
      },
      ASSIGNMENT_STATUS.APPROVED
    );
    closeApprovalModal();
  };

  // Handle revision submission for ApprovalModal (wrapper)
  const handleRevisionFromApprovalModal = async (formData: any) => {

    await updateAssignmentStatus(
      {
        selectedSkills: formData?.selectedSkills || [],
        justification: formData?.justification || "",
        feedback: formData?.feedback || "",
        questionComments: modalDefaultValues?.questionComments || {},
      },
      ASSIGNMENT_STATUS.NEEDS_REVISION
    );
    closeApprovalModal();
  };

  // Handle revision submission for RevisionModal
  const handleRevisionSubmit = async (feedback: string) => {

    await updateAssignmentStatus(
      {
        selectedSkills: modalDefaultValues.selectedSkills || [],
        justification: modalDefaultValues.justification || "",
        feedback: feedback,
        questionComments: modalDefaultValues?.questionComments || {},
      },
      ASSIGNMENT_STATUS.NEEDS_REVISION
    );
    closeRevisionModal();
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
    console.error("[TeacherAssignmentView] Assignment not found or invalid ID:", id);
    return (
      <div className="flex items-center justify-center h-screen">
        <Error
          fullScreen
          title="Assignment Not Found"
          message="The assignment you're looking for doesn't exist or you don't have permission to view it."
          homeButtonText="Return to Dashboard"
          onHome={() => navigate("/teacher")}
          retryButtonText="Try Again"
          retry={refetchAssignment}
        />
      </div>
    );
  }

  const isApproved = assignment?.status === ASSIGNMENT_STATUS.APPROVED;
  const isRevisionRequested = assignment?.status === ASSIGNMENT_STATUS.NEEDS_REVISION;
  const showActionButtons = !isApproved && !isRevisionRequested;

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Assignment Review</h1>

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
          <div className="rounded border border-slate-200 flex flex-col shadow-sm bg-white relative"  style={{isolation: 'isolate', contain: 'layout style'}}>
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200" style={{position: 'sticky', zIndex: 100}}>
              <TeacherHeader
                studentName={student?.name || "Student"}
                subject={assignment.subject || "Unknown Subject"}
                grade={assignment.grade || "Unknown Grade"}
                isApproved={isApproved}
                isRevisionRequested={isRevisionRequested}
                onApprove={handleApprove}
                onRequestRevision={handleRequestRevision}
                showActionButtons={showActionButtons}
              />
            </div>

            {/* Content */}
            <StepContent
              activeStep={activeStep}
              onApprove={handleApprove}
              onRevision={handleRequestRevision}
              defaultStates={modalDefaultValues}
              onFormDataChange={handleFormDataChange}
              isApproved={isApproved}
              isRevisionRequested={isRevisionRequested}
              form={form as UseFormReturn<AssignmentFormValues>}
              feedbackItems={feedbackItems}
            />
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {isApprovalModalOpen && (
        <ApprovalModal
          isOpen={isApprovalModalOpen}
          onClose={closeApprovalModal}
          onApprove={handleApprovalSubmit}
          onRevision={handleRevisionFromApprovalModal}
          defaultStates={modalDefaultValues}
          onFormDataChange={handleFormDataChange}
        />
      )}

      {/* Revision Modal */}
      {isRevisionModalOpen && (
        <RevisionModal
          isOpen={isRevisionModalOpen}
          onClose={closeRevisionModal}
          onSubmit={handleRevisionSubmit}
          currentFeedback={modalDefaultValues.feedback}
        />
      )}
    </div>
  );
};

export default TeacherAssignmentView;
