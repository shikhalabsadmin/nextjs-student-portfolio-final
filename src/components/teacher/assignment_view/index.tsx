import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ASSIGNMENT_STATUS } from '@/constants/assignment-status';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { type AssignmentFormValues } from '@/lib/validations/assignment';
import { getAssignment } from '@/lib/api/assignments';
import { ToastService } from '@/lib/services/toast.service';
import { NotificationService } from '@/lib/services/notification.service';

// Import the components directly now that we have declaration files
import { TeacherSidebar } from './TeacherSidebar';
import { TeacherHeader } from './TeacherHeader';
import { RevisionModal } from './RevisionModal';
import { ApprovalModal } from './ApprovalModal';

// Import UI components
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Import the PreviewStep component directly
import { PreviewStep } from "@/components/assignment/steps/PreviewStep";
import { BasicInfoStep } from "@/components/assignment/steps/BasicInfoStep";
import { CollaborationStep } from "@/components/assignment/steps/CollaborationStep";
import { ProcessStep } from "@/components/assignment/steps/ProcessStep";
import { ReflectionStep } from "@/components/assignment/steps/ReflectionStep";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FileText, Users, Lightbulb, PenTool, Brain } from 'lucide-react';
import { Loading } from "@/components/ui/loading";
import { Error } from "@/components/ui/error";

interface StudentProfile {
  id: string;
  full_name?: string;
  grade?: string;
  email?: string;
  avatar_url?: string;
}

// Type for feedback
interface Feedback {
  text: string;
  date: string;
  [key: string]: unknown; // Index signature to make it compatible with Record<string, unknown>
}

type TeacherAssignmentViewProps = {
  user: User;
};

const TeacherAssignmentView = ({ user }: TeacherAssignmentViewProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Start with loading set to true to prevent unnecessary renders
  const [isLoading, setIsLoading] = useState(true);
  const [assignment, setAssignment] = useState<AssignmentFormValues | null>(null);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [activeTab, setActiveTab] = useState('template');
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  
  // Create services only once with useMemo to prevent recreation on re-renders
  const toast = useMemo(() => new ToastService(), []);
  const notificationService = useMemo(() => NotificationService.getInstance(), []);

  // Set up form with default values
  const form = useForm<AssignmentFormValues>({
    defaultValues: useMemo(() => ({
      status: ASSIGNMENT_STATUS.SUBMITTED,
    }), []),
    // Set mode to onSubmit to reduce validation runs
    mode: 'onSubmit'
  });

  const openRevisionModal = () => {
    setIsRevisionModalOpen(true);
  };

  const closeRevisionModal = () => {
    setIsRevisionModalOpen(false);
  };

  const openApprovalModal = () => {
    setIsApprovalModalOpen(true);
  };

  const closeApprovalModal = () => {
    setIsApprovalModalOpen(false);
  };

  // Memoize fetchAssignment to prevent unnecessary recreations
  const fetchAssignment = useCallback(async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      // Get assignment data
      const assignmentData = await getAssignment(id);
      if (!assignmentData) {
        toast.error('Assignment not found');
        return;
      }
      
      // Store the assignment data in state to reduce form.getValues() calls
      setAssignment(assignmentData);
      
      // Fetch student profile
      if (assignmentData.student_id) {
        const { data: studentData, error: studentError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', assignmentData.student_id)
          .single();
          
        if (studentError) throw studentError;
        setStudent(studentData as StudentProfile);
      }
      
      // Set form values
      form.reset(assignmentData, {
        keepDefaultValues: true,
        keepDirty: false,
      });
    } catch (error) {
      console.error('Error fetching assignment:', error);
      toast.error('Failed to load assignment details');
    } finally {
      setIsLoading(false);
    }
  }, [id, form, toast]);

  // Fetch assignment data only once when component mounts or id changes
  useEffect(() => {
    fetchAssignment();
    
    // Return cleanup function to cancel any pending requests
    return () => {
      // Cancel any pending operations
      setIsLoading(false);
    };
  }, [id, fetchAssignment]);

  const handleApprove = useCallback(async (skillsData: { selectedSkills: string[], justification: string, feedback?: string }) => {
    if (!assignment?.id) return;
    
    try {
      const { error } = await supabase
        .from('assignments')
        .update({ 
          status: ASSIGNMENT_STATUS.APPROVED, 
          teacher_id: user.id,
          verified_at: new Date().toISOString(),
          teacher_skills: skillsData.selectedSkills,
          skills_justification: skillsData.justification,
          teacher_feedback: skillsData.feedback || null
        })
        .eq('id', assignment.id);
        
      if (error) throw error;
      
      // Update form and assignment state
      const updatedAssignment = {
        ...assignment,
        status: ASSIGNMENT_STATUS.APPROVED,
        verified_at: new Date().toISOString(),
        teacher_skills: skillsData.selectedSkills,
        skills_justification: skillsData.justification,
        teacher_feedback: skillsData.feedback || null
      };
      setAssignment(updatedAssignment);
      form.reset(updatedAssignment, { keepDefaultValues: true });
      
      // Notify student
      const studentId = assignment.student_id;
      const title = assignment.title || 'Untitled Assignment';
      
      if (studentId) {
        try {
          // Using notifyAssignmentVerified from the notification service
          await notificationService.notifyAssignmentVerified(
            studentId,
            title,
            assignment.id
          );
        } catch (err) {
          console.error('Failed to send notification:', err);
          // Continue anyway - approval was successful
        }
      }
      
      toast.success('Assignment approved successfully');
    } catch (error) {
      console.error('Error approving assignment:', error);
      toast.error('Failed to approve assignment');
    }
  }, [assignment, form, notificationService, toast, user.id]);

  const handleRequestRevision = useCallback(async (feedbackText: string) => {
    if (!assignment?.id) return;
    
    try {
      // Create the feedback object
      const feedbackData = {
        text: feedbackText,
        date: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('assignments')
        .update({ 
          status: ASSIGNMENT_STATUS.NEEDS_REVISION, 
          teacher_id: user.id,
          feedback: feedbackData
        })
        .eq('id', assignment.id);
        
      if (error) throw error;
      
      // Update form and assignment state
      const updatedAssignment = {
        ...assignment,
        status: ASSIGNMENT_STATUS.NEEDS_REVISION,
        feedback: feedbackData
      };
      setAssignment(updatedAssignment);
      form.reset(updatedAssignment, { keepDefaultValues: true });
      
      // Notify student
      const studentId = assignment.student_id;
      const title = assignment.title || 'Untitled Assignment';
      
      if (studentId) {
        try {
          // Using notifyAssignmentNeedsRevision from the notification service
          await notificationService.notifyAssignmentNeedsRevision(
            studentId,
            title,
            feedbackText,
            assignment.id
          );
        } catch (err) {
          console.error('Failed to send notification:', err);
          // Continue anyway - revision request was successful
        }
      }
      
      toast.success('Revision requested successfully');
      setActiveTab('template');
    } catch (error) {
      console.error('Error requesting revision:', error);
      toast.error('Failed to request revision');
    }
  }, [assignment, form, notificationService, toast, user.id]);

  // Show loading state until data is fetched
  if (isLoading) {
    return <Loading fullScreen text="Loading assignment..." />;
  }

  // Don't attempt to render content if no assignment was loaded
  if (!assignment?.id) {
    return (
      <Error 
        fullScreen 
        title="Assignment Not Found" 
        message="The assignment you're looking for doesn't exist or you don't have permission to view it."
        homeButtonText="Return to Dashboard"
        onHome={() => navigate('/app/teacher/dashboard')}
        retryButtonText="Try Again"
        retry={fetchAssignment}
      />
    );
  }

  // Use the assignment state directly instead of form.getValues() to reduce rerenders
  const assignmentStatus = assignment.status;
  const canApprove = assignmentStatus === ASSIGNMENT_STATUS.SUBMITTED;
  const isApproved = assignmentStatus === ASSIGNMENT_STATUS.APPROVED;
  const needsRevision = assignmentStatus === ASSIGNMENT_STATUS.NEEDS_REVISION;

  // Get feedback and handle type conversion safely
  const feedbackData = assignment.feedback;
  // Validate the feedback object structure
  const feedback = 
    feedbackData && 
    typeof feedbackData === 'object' && 
    'text' in feedbackData && 
    'date' in feedbackData
      ? feedbackData as Feedback 
      : undefined;
  
  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:gap-8">
        {/* Sidebar - styled to match student side */}
        <div className="w-full md:w-80 h-max mb-6 md:mb-0">
          <TeacherSidebar 
            student={student} 
            assignmentStatus={assignmentStatus} 
          />
        </div>

        {/* Main content area */}
        <div className="flex-1">
          <Form {...form}>
            <div className="rounded-lg border border-gray-200 flex flex-col h-[calc(100vh-8rem)] overflow-hidden shadow-sm bg-white">
              {/* Custom header for teacher view */}
              <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
                <TeacherHeader 
                  title={assignment.title || 'Untitled Assignment'} 
                  studentName={student?.full_name}
                  subject={assignment.subject}
                  grade={assignment.grade}
                  status={assignmentStatus}
                  submittedDate={assignment.submitted_at}
                  canApprove={canApprove}
                  isApproved={isApproved}
                  needsRevision={needsRevision}
                  onApprove={openApprovalModal}
                  openRevisionModal={openRevisionModal}
                />
              </div>

              {/* Main tabs - Template View and Form View */}
              <div className="flex-1 overflow-auto">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="sticky top-0 z-10 bg-white">
                    <TabsList className="bg-transparent flex w-auto h-auto p-0">
                      <TabsTrigger 
                        value="template" 
                        className="px-8 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-b-2 data-[state=active]:border-black text-lg font-medium -mb-[2px]"
                      >
                        Template View
                      </TabsTrigger>
                      <TabsTrigger 
                        value="form" 
                        className="px-8 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-b-2 data-[state=active]:border-black text-lg font-medium -mb-[2px]"
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
                      {/* Form View - Display only the form steps in an accordion */}
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="step1" className="border-b border-gray-200">
                          <AccordionTrigger className="py-4">
                            <div className="flex items-center">
                              <PenTool className="h-5 w-5 text-blue-500 mr-2" />
                              <h2 className="text-lg font-medium">Basic Information</h2>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4">
                            <BasicInfoStep form={form} />
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="step2" className="border-b border-gray-200">
                          <AccordionTrigger className="py-4">
                            <div className="flex items-center">
                              <Users className="h-5 w-5 text-purple-500 mr-2" />
                              <h2 className="text-lg font-medium">Collaboration and Originality</h2>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4">
                            <CollaborationStep form={form} />
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="step3" className="border-b border-gray-200">
                          <AccordionTrigger className="py-4">
                            <div className="flex items-center">
                              <Lightbulb className="h-5 w-5 text-amber-500 mr-2" />
                              <h2 className="text-lg font-medium">Skills and Reflection</h2>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4">
                            <ProcessStep form={form} />
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="step4" className="border-b border-gray-200">
                          <AccordionTrigger className="py-4">
                            <div className="flex items-center">
                              <Brain className="h-5 w-5 text-green-500 mr-2" />
                              <h2 className="text-lg font-medium">Process and Challenges</h2>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4">
                            <ReflectionStep form={form} />
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
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
        onClose={closeRevisionModal}
        onSubmit={handleRequestRevision}
        currentFeedback={feedback?.text || ''}
      />

      {/* Approval Modal at the parent level */}
      <ApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={closeApprovalModal}
        onSubmit={handleApprove}
      />
    </div>
  );
};

export default TeacherAssignmentView;