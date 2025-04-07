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
import { RevisionModal } from "./RevisionModal";
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

type TeacherAssignmentViewProps = {
  user: User;
};

type Tabs = "template" | "form";

const TeacherAssignmentView = ({ user }: TeacherAssignmentViewProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Start with loading set to true to prevent unnecessary renders
  const [isLoading, setIsLoading] = useState(true);
  const [assignment, setAssignment] = useState<AssignmentFormValues | null>(
    null
  );
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tabs>("template");
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState<boolean>(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState<boolean>(false);

  // Create services only once with useMemo to prevent recreation on re-renders
  const toast = useMemo(() => new ToastService(), []);

  // Set up form with default values
  const form = useForm<AssignmentFormValues>({
    defaultValues: useMemo(
      () => ({
        status: ASSIGNMENT_STATUS.SUBMITTED,
      }),
      []
    ),
    // Set mode to onSubmit to reduce validation runs
    mode: "onSubmit",
  });

  // Handle revision modal
  const handleRevisionModal = () => {
    setIsRevisionModalOpen((pre) => !pre);
  };

  // Handle approval modal
  const handleApprovalModal = () => {
    setIsApprovalModalOpen((pre) => !pre);
  };

  // Define accordion sections
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

  // Memoize fetchAssignment to prevent unnecessary recreations
  const fetchAssignment = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      // Get assignment data
      const assignmentData = await getAssignmentWithFiles(id);

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
          // Continue with null student data instead of returning
          console.error("Student profile error:", studentError);
        } else {
          setStudent(studentData as StudentProfile || null);
        }
      }

      // Store the assignment data in state to reduce form.getValues() calls
      setAssignment(assignmentData);

      // Set form values
      form.reset(assignmentData, {
        keepDefaultValues: true,
        keepDirty: false,
      });
    } catch (error) {
      console.error("Error fetching assignment:", error);
      toast.error("Failed to load assignment details");
    } finally {
      setIsLoading(false);
    }
  }, [id, form, toast]);

  const handleApprove = useCallback(
    async (skillsData: {
      selectedSkills: string[];
      justification: string;
      feedback?: string;
    }) => {
      if (!assignment?.id) return;

      let feedbackData = {}

      if(skillsData?.feedback){
        feedbackData = {
          text: skillsData.feedback,
          date: new Date().toISOString(),
          teacher_id: user?.id || null,
        };
      }

      const updatedData = {
        status: ASSIGNMENT_STATUS.APPROVED,
        verified_at: new Date().toISOString(),
        selected_skills: skillsData?.selectedSkills || [],
        skills_justification: skillsData?.justification || "",
        feedback: feedbackData,
      };

      console.log("Handle Approve request","Updated Data", updatedData)

      try {
        const { error } = await supabase
          .from("assignments")
          .update(updatedData)
          .eq("id", assignment.id);

        if (error) {
          console.error("Error approving assignment:", error);
          toast.error("Failed to approve assignment");
          return;
        }

        console.log("Handle Approve request","Updated Data", updatedData)

        // Update form and assignment state
        const updatedAssignment = {
          ...assignment,
          ...updatedData
        };
        setAssignment(updatedAssignment);
        form.reset(updatedAssignment, { keepDefaultValues: true });
        toast.success("Assignment approved successfully");
        setActiveTab("template");
        navigate(ROUTES.TEACHER.DASHBOARD);
      } catch (error) {
        console.error("Error approving assignment:", error);
        toast.error("Failed to approve assignment");
      }
    },
    [assignment, form, navigate, toast, user?.id]
  );

  const handleRequestRevision = useCallback(
    async (feedbackText: string) => {
      if (!assignment?.id) return;

      try {
        // Create the feedback object
        const feedbackData = {
          text: feedbackText || "",
          date: new Date().toISOString(),
          teacher_id: user?.id || null,
        };

        const { error } = await supabase
          .from("assignments")
          .update({
            status: ASSIGNMENT_STATUS.NEEDS_REVISION,
            feedback: feedbackData,
          })
          .eq("id", assignment.id);

        if (error) {
          toast.error("Failed to request revision");
          return;
        }
        

        // Update form and assignment state
        const updatedAssignment = {
          ...assignment,
          status: ASSIGNMENT_STATUS.NEEDS_REVISION,
          feedback: feedbackData,
        };
        setAssignment(updatedAssignment);
        form.reset(updatedAssignment, { keepDefaultValues: true });

        toast.success("Revision requested successfully");
        setActiveTab("template");
        navigate(ROUTES.TEACHER.DASHBOARD);
      } catch (error) {
        console.error("Error requesting revision:", error);
        toast.error("Failed to request revision");
      }
    },
    [assignment, form, navigate, toast, user?.id]
  );

  // Fetch assignment data only once when component mounts or id changes
  useEffect(() => {
    fetchAssignment();

    // Return cleanup function to cancel any pending requests
    return () => {
      // Cancel any pending operations
      setIsLoading(false);
    };
  }, [id, fetchAssignment]);

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

  console.log("Assignment", assignment)

  return (
    <div className="px-8 py-5 md:px-16 md:py-10">
      <div className="flex flex-col gap-4 md:gap-8 md:flex-row">
        {/* Sidebar - styled to match student side */}
        <TeacherSidebar />

        {/* Main content area */}
        <div className="flex-1">
          <Form {...form}>
            <div className="rounded border border-slate-200 flex flex-col h-[calc(100vh-8rem)] overflow-hidden shadow-sm bg-white">
              {/* Custom header for teacher view */}
              <div className="sticky top-0 z-10 bg-white border-b border-slate-200">
                <TeacherHeader
                  studentName={student?.full_name || "Student"}
                  subject={assignment.subject || "Unknown Subject"}
                  grade={assignment.grade || "Unknown Grade"}
                  isApproved={assignment?.status === ASSIGNMENT_STATUS.APPROVED}
                  onApprove={handleApprovalModal}
                  openRevisionModal={handleRevisionModal}
                />
              </div>

              {/* Main tabs - Template View and Form View */}
              <div className="flex-1 overflow-auto">
                <Tabs
                  value={activeTab}
                  onValueChange={(value) => setActiveTab(value as Tabs)}
                  className="w-full"
                >
                  <div className="sticky top-0 z-10 bg-white">
                    <TabsList className="bg-transparent flex w-auto h-auto p-0 gap-6 sm:gap-12 px-4 sm:px-0 justify-center">
                      <TabsTrigger
                        value="template"
                        className="px-0 py-3 sm:py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-b-2 data-[state=active]:border-black text-sm font-normal data-[state=active]:font-semibold text-slate-600 hover:text-slate-900"
                      >
                        Template View
                      </TabsTrigger>
                      <TabsTrigger
                        value="form"
                        className="px-0 py-3 sm:py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-b-2 data-[state=active]:border-black text-sm font-normal data-[state=active]:font-semibold text-slate-600 hover:text-slate-900"
                      >
                        Form View
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="p-0">
                    <TabsContent value="template" className="mt-0 p-6">
                      {/* Template View - Display the PreviewStep component */}
                      <PreviewStep form={form} />
                    </TabsContent>

                    <TabsContent value="form" className="mt-0 p-6">
                      {/* Form View - Use the FormViewAccordion with sections as props */}
                      <FormViewAccordion 
                        sections={formSections}
                        defaultValue="basic-info"
                        customClassName={{
                          content:"pointer-events-none "
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

      {/* Revision Modal at the parent level */}
      <RevisionModal
        isOpen={isRevisionModalOpen}
        onClose={handleRevisionModal}
        onSubmit={handleRequestRevision}
        currentFeedback={typeof assignment?.feedback?.text === 'string' ? assignment.feedback.text : ""}
      />

      {/* Approval Modal at the parent level */}
      <ApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={handleApprovalModal}
        onSubmit={handleApprove}
        defaultSkills={Array.isArray(assignment?.selected_skills) ? assignment.selected_skills : []}
        defaultJustification={typeof assignment?.skills_justification === 'string' ? assignment.skills_justification : ""}
        defaultFeedback={typeof assignment?.feedback?.text === 'string' ? assignment.feedback.text : ""}
      />
    </div>
  );
};

export default TeacherAssignmentView;
