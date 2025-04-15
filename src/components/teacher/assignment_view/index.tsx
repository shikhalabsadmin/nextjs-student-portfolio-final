import { useState, useEffect, useCallback, useMemo } from "react";
import { User } from "@supabase/supabase-js";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ASSIGNMENT_STATUS } from "@/constants/assignment-status";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { type AssignmentFormValues } from "@/lib/validations/assignment";
import { getAssignmentWithFiles } from "@/lib/api/assignments";
import { ToastService } from "@/lib/services/toast.service";

// Import the components directly now that we have declaration files
import { TeacherSidebar } from "./TeacherSidebar";
import { TeacherHeader } from "./TeacherHeader";
import { ApprovalModal } from "./ApprovalModal";

// Import UI components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormViewAccordion, type AccordionSection } from "@/components/ui/form-view-accordion";

// Import the PreviewStep component directly
import { PreviewStep } from "@/components/assignment/steps/PreviewStep";
import { BasicInfoStep } from "@/components/assignment/steps/BasicInfoStep";
import { CollaborationStep } from "@/components/assignment/steps/CollaborationStep";
import { ProcessStep } from "@/components/assignment/steps/ProcessStep";
import { ReflectionStep } from "@/components/assignment/steps/ReflectionStep";

import { Loading } from "@/components/ui/loading";
import { Error } from "@/components/ui/error";
import { ROUTES } from "@/config/routes";

interface StudentProfile {
  id: string;
  full_name?: string;
  grade?: string;
  email?: string;
  avatar_url?: string;
}

type TeacherFeedback = {
  selected_skills?: string[];
  skills_justification?: string;
  text?: string;
  date?: string;
  teacher_id?: string | null;
};

type TeacherAssignmentViewProps = {
  user: User;
};

type TabType = "template" | "form";

// Custom hook to fetch and manage assignment data
const useAssignmentData = (assignmentId: string | undefined, user: User) => {
  const [isLoading, setIsLoading] = useState(true);
  const [assignment, setAssignment] = useState<AssignmentFormValues | null>(null);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [feedback, setFeedback] = useState<TeacherFeedback>({
    selected_skills: [],
    skills_justification: "",
    text: "",
  });
  
  const toast = useMemo(() => new ToastService(), []);
  const navigate = useNavigate();
  
  // Set up form with default values
  const form = useForm<AssignmentFormValues>({
    defaultValues: useMemo(
      () => ({
        status: ASSIGNMENT_STATUS.SUBMITTED,
      }),
      []
    ),
    mode: "onSubmit",
  });

  // Fetch assignment data
  const fetchAssignment = useCallback(async () => {
    if (!assignmentId) return;

    setIsLoading(true);
    try {
      // Get assignment data
      const assignmentData = await getAssignmentWithFiles(assignmentId);

      // Check if assignment data is found
      if (!assignmentData) {
        toast.error("Error while loading student assignment");
        return;
      }

      // Fetch student profile
      if (assignmentData?.student_id) {
        const { data: studentData, error: studentError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", assignmentData.student_id)
          .single();

        if (studentError) {
          toast.error("Error while loading student profile");
          console.error("Student profile error:", studentError);
        } else {
          setStudent(studentData as StudentProfile || null);
        }
      }

      // Store the assignment data
      setAssignment(assignmentData);

      // Set form values
      form.reset(assignmentData, {
        keepDefaultValues: true,
        keepDirty: false,
      });

      // Set feedback data
      setFeedback({
        selected_skills: assignmentData?.feedback?.selected_skills || [],
        skills_justification: assignmentData?.feedback?.skills_justification || "",
        text: assignmentData?.feedback?.text || "",
      });

    } catch (error) {
      console.error("Error fetching assignment:", error);
      toast.error("Failed to load assignment details");
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId, form, toast]);

  // Update assignment status with feedback
  const updateAssignmentStatus = useCallback(async (
    feedbackData: {
      selectedSkills: string[];
      justification: string;
      feedback?: string;
    },
    assignmentStatus: keyof typeof ASSIGNMENT_STATUS
  ) => {
    if (!assignment?.id) return;

    try {
      const teacherFeedback = {
        selected_skills: feedbackData?.selectedSkills || [],
        skills_justification: feedbackData?.justification || "",
        text: feedbackData?.feedback || "",
        date: new Date().toISOString(),
        teacher_id: user?.id || null,
      };

      const updatedData = {
        status: assignmentStatus,
        feedback: teacherFeedback,
        verified_at: assignmentStatus === ASSIGNMENT_STATUS.APPROVED ? new Date().toISOString() : null,
      };

      const { error } = await supabase
        .from("assignments")
        .update(updatedData)
        .eq("id", assignment?.id);
        
      if (error) {
        console.error("Error updating assignment:", error);
        toast.error("Failed to update assignment");
        return;
      }

      toast.success("Assignment updated successfully");
      navigate(ROUTES.TEACHER.DASHBOARD);
     
    } catch (error) {
      console.error("Error updating assignment:", error);
      toast.error("Failed to update assignment");
    }
  }, [assignment?.id, navigate, toast, user?.id]);

  // Load data on component mount
  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

  return {
    isLoading,
    assignment,
    student,
    feedback,
    form,
    toast,
    fetchAssignment,
    updateAssignmentStatus,
    setFeedback
  };
};

// TabSelector component to improve readability and reduce nesting
const TabSelector = ({ activeTab, setActiveTab }: { 
  activeTab: TabType; 
  setActiveTab: (tab: TabType) => void;
}) => (
  <div className="sticky top-0 z-10 bg-white">
    <TabsList className="bg-transparent flex w-auto h-auto p-0 gap-6 sm:gap-12 px-4 sm:px-0 justify-center">
      <TabsTrigger
        value="template"
        className="px-0 py-3 sm:py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-b-2 data-[state=active]:border-black text-sm font-normal data-[state=active]:font-semibold text-slate-600 hover:text-slate-900"
        onClick={() => setActiveTab("template")}
      >
        Template View
      </TabsTrigger>
      <TabsTrigger
        value="form"
        className="px-0 py-3 sm:py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-b-2 data-[state=active]:border-black text-sm font-normal data-[state=active]:font-semibold text-slate-600 hover:text-slate-900"
        onClick={() => setActiveTab("form")}
      >
        Form View
      </TabsTrigger>
    </TabsList>
  </div>
);

const TeacherAssignmentView = ({ user }: TeacherAssignmentViewProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("template");
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);
  
  // Use the custom hook for data fetching and management
  const {
    isLoading,
    assignment,
    student,
    feedback,
    form,
    fetchAssignment,
    updateAssignmentStatus,
    setFeedback
  } = useAssignmentData(id, user);

  // Define accordion sections once
  const formSections: AccordionSection[] = useMemo(() => [
    {
      id: "basic-info",
      title: "Basic Information",
      content: <BasicInfoStep form={form} />
    },
    {
      id: "collaboration",
      title: "Collaboration and Originality",
      content: <CollaborationStep form={form} />
    },
    {
      id: "skills",
      title: "Skills and Reflection",
      content: <ProcessStep form={form} />
    },
    {
      id: "process",
      title: "Process and Challenges",
      content: <ReflectionStep form={form} />
    }
  ], [form]);

  // Toggle feedback modal visibility
  const toggleFeedbackModal = useCallback(() => {
    setIsFeedbackModalOpen(prevState => !prevState);
  }, []);

  if (isLoading) {
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
          retry={fetchAssignment}
        />
      </div>
    );
  }

  return (
    <div className="px-8 py-5 md:px-16 md:py-10">
      <div className="flex flex-col gap-4 md:gap-8 md:flex-row">
        {/* Sidebar */}
        <TeacherSidebar />

        {/* Main content area */}
        <div className="flex-1">
          <Form {...form}>
            <div className="rounded border border-slate-200 flex flex-col h-[calc(100vh-8rem)] overflow-hidden shadow-sm bg-white">
              {/* Header */}
              <div className="sticky top-0 z-10 bg-white border-b border-slate-200">
                <TeacherHeader
                  studentName={student?.full_name || "Student"}
                  subject={assignment.subject || "Unknown Subject"}
                  grade={assignment.grade || "Unknown Grade"}
                  isApproved={assignment?.status === ASSIGNMENT_STATUS.APPROVED}
                  sendFeedback={toggleFeedbackModal}
                />
              </div>

              {/* Main content tabs */}
              <div className="flex-1 overflow-auto">
                <Tabs
                  value={activeTab}
                  onValueChange={(value) => setActiveTab(value as TabType)}
                  className="w-full"
                >
                  <TabSelector activeTab={activeTab} setActiveTab={setActiveTab} />

                  <div className="p-0">
                    <TabsContent value="template" className="mt-0 p-6">
                      {/* Template View */}
                      <PreviewStep form={form} />
                    </TabsContent>

                    <TabsContent value="form" className="mt-0 p-6">
                      {/* Form View */}
                      <FormViewAccordion 
                        sections={formSections}
                        defaultValue="basic-info"
                        customClassName={{
                          content: "pointer-events-none"
                        }}
                      />
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </div>
          </Form>
        </div>
      </div>

      {/* Approval Modal */}
      <ApprovalModal
        isOpen={isFeedbackModalOpen}
        onClose={toggleFeedbackModal}
        onRevision={async (formData) => {
          await updateAssignmentStatus({
            selectedSkills: formData?.selectedSkills || [], 
            justification: formData?.justification || "",
            feedback: formData?.feedback || "",
          }, ASSIGNMENT_STATUS.NEEDS_REVISION);
        }}
        onApprove={async (formData) => {
          await updateAssignmentStatus({
            selectedSkills: formData?.selectedSkills || [],
            justification: formData?.justification || "",
            feedback: formData?.feedback || "",
          }, ASSIGNMENT_STATUS.APPROVED);
        }}
        defaultStates={{
          selectedSkills: feedback?.selected_skills || [],
          justification: feedback?.skills_justification || "",
          feedback: feedback?.text || ""
        }}
        onFormDataChange={formData => {
          setFeedback({
            selected_skills: formData?.selectedSkills || [],
            skills_justification: formData?.justification || "",
            text: formData?.feedback || ""
          });
        }}
      />
    </div>
  );
};

export default TeacherAssignmentView;
