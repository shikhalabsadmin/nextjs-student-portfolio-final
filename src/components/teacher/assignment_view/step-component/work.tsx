import React, { useMemo, useState, useEffect, useRef, createContext, useContext } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssignmentFormValues, QuestionComment } from "@/lib/validations/assignment";
import { PreviewStep } from "@/components/assignment/steps/PreviewStep";
import { UseFormReturn } from "react-hook-form";
import { BasicInfoStep } from "@/components/assignment/steps/BasicInfoStep";
import { BasicInfoStepWithComments } from "@/components/assignment/steps/BasicInfoStepWithComments";
import { CollaborationStep } from "@/components/assignment/steps/CollaborationStep";
import { CollaborationStepWithComments } from "@/components/assignment/steps/CollaborationStepWithComments";
import { ProcessStep } from "@/components/assignment/steps/ProcessStep";
import { ProcessStepWithComments } from "@/components/assignment/steps/ProcessStepWithComments";
import { ReflectionStep } from "@/components/assignment/steps/ReflectionStep";
import { ReflectionStepWithComments } from "@/components/assignment/steps/ReflectionStepWithComments";
import { FormViewAccordion } from "@/components/ui/form-view-accordion";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuestionComments } from "@/hooks/useQuestionComments";
import { useAuthState } from "@/hooks/useAuthState";

// Context for question comments
interface QuestionCommentsContextType {
  getComment: (questionId: string) => QuestionComment | undefined;
  addComment: (questionId: string, comment: string) => void;
  removeComment: (questionId: string) => void;
  hasComments: boolean;
  commentsCount: number;
}

const QuestionCommentsContext = createContext<QuestionCommentsContextType | null>(null);

export const useQuestionCommentsContext = () => {
  const context = useContext(QuestionCommentsContext);
  if (!context) {
    throw new Error("useQuestionCommentsContext must be used within QuestionCommentsProvider");
  }
  return context;
};

// Type for the tab values
type TabType = "template" | "form";

interface WorkProps {
  form?: UseFormReturn<AssignmentFormValues>;
  initialStep?: number;
  onQuestionCommentsChange?: (comments: Record<string, QuestionComment>) => void;
}

const Work: React.FC<WorkProps> = ({ form, initialStep = 0, onQuestionCommentsChange }) => {
  const [activeTab, setActiveTab] = useState<TabType>("form"); // Default to form view
  const [activeSection, setActiveSection] = useState<string>("basic-info");
  const { user } = useAuthState();
  
  // References to accordion sections for scrolling
  const basicInfoRef = useRef<HTMLDivElement>(null);
  const filesRef = useRef<HTMLDivElement>(null);
  const reflectionRef = useRef<HTMLDivElement>(null);

  // Get existing question comments from form data
  const existingComments = useMemo(() => {
    const feedback = form?.getValues("feedback");

    
    if (Array.isArray(feedback) && feedback.length > 0) {
      // Get the most recent feedback item that has question comments
      const latestFeedback = feedback[0];
      
      return latestFeedback?.question_comments || {};
    }
    
    return {};
  }, [form]);

  // Initialize question comments hook
  const questionComments = useQuestionComments({
    teacherId: user?.id || "",
    existingComments,
    onCommentsChange: (comments) => {
  
      onQuestionCommentsChange?.(comments);
    },
  });

  // Map initialStep to section ID
  useEffect(() => {
    const sectionMap = ["basic-info", "files", "reflection"];
    if (initialStep >= 0 && initialStep < sectionMap.length) {
      const newSection = sectionMap[initialStep];
      setActiveSection(newSection);
      setActiveTab("form"); // Switch to form view when changing sections
      
      // Scroll to the appropriate section after a short delay to ensure rendering
      setTimeout(() => {
        scrollToSection(newSection);
      }, 100);
    }
  }, [initialStep]);

  // Function to scroll to the appropriate section
  const scrollToSection = (sectionId: string) => {
    let ref;
    switch(sectionId) {
      case "basic-info":
        ref = basicInfoRef;
        break;
      case "files":
        ref = filesRef;
        break;
      case "reflection":
        ref = reflectionRef;
        break;
      default:
        ref = null;
    }
    
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Sections for the accordion
  const formSections = useMemo(() => {
    if (!form) return [];

    return [
      {
        id: "basic-info",
        title: "Basic Information", 
        content: (
          <div ref={basicInfoRef}>
            <BasicInfoStepWithComments form={form} isTeacherView={true} />
          </div>
        ),
      },
      {
        id: "files",
        title: "Files & Links",
        content: (
          <div ref={filesRef}>
            <CollaborationStepWithComments form={form} isTeacherView={true} />
            <ProcessStepWithComments form={form} isTeacherView={true} />
          </div>
        ),
      },
      {
        id: "reflection",
        title: "Reflection",
        content: (
          <div ref={reflectionRef}>
            <ReflectionStepWithComments form={form} isTeacherView={true} />
          </div>
        ),
      },
    ];
  }, [form]);

  // Handle mobile tab selection
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // If no form is provided, show an error
  if (!form) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-red-500">
        No assignment data available
      </div>
    );
  }

  return (
    <QuestionCommentsContext.Provider value={questionComments}>
      <div className="flex flex-col h-full">
        {/* Comment Summary */}
        {questionComments.hasComments && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 mx-2 sm:mx-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-blue-900">
                📝 You have {questionComments.commentsCount} question comment{questionComments.commentsCount !== 1 ? 's' : ''}
              </div>
              <div className="text-xs text-blue-600">
                Comments will be included in your feedback
              </div>
            </div>
          </div>
        )}

        {/* Mobile tab selector */}
        <div className="md:hidden p-2 border-b border-slate-200">
          <div className="flex gap-2">
            <Button
              variant={activeTab === "template" ? "default" : "outline"}
              size="sm"
              onClick={() => handleTabChange("template")}
              className="flex-1"
            >
              Template View
            </Button>
            <Button
              variant={activeTab === "form" ? "default" : "outline"}
              size="sm"
              onClick={() => handleTabChange("form")}
              className="flex-1"
            >
              Form View
            </Button>
          </div>
        </div>

        {/* Desktop/Tablet view */}
        <Tabs
          defaultValue="form"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabType)}
          className="flex-1 flex flex-col h-full"
        >
          <TabsList className="bg-transparent hidden md:flex w-auto h-auto p-0 gap-6 sm:gap-12 px-0 justify-center">
            <TabsTrigger
              value="template"
              className="px-0 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-b-2 data-[state=active]:border-black text-sm font-normal data-[state=active]:font-semibold text-slate-600 hover:text-slate-900"
            >
              Template View
            </TabsTrigger>
            <TabsTrigger
              value="form"
              className="px-0 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-b-2 data-[state=active]:border-black text-sm font-normal data-[state=active]:font-semibold text-slate-600 hover:text-slate-900"
            >
              Form View
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent 
              value="template" 
              className="m-0 h-full overflow-auto"
            >
              <div className="p-2 sm:p-4">
                <PreviewStep form={form} />
              </div>
            </TabsContent>
            
            <TabsContent 
              value="form" 
              className="m-0 h-full overflow-auto relative"
              style={{clipPath: 'inset(0)'}}
            >
              <div className="p-2 sm:p-4">
                <Form {...form}>
                  <FormViewAccordion
                    sections={formSections}
                    defaultValue={activeSection}
                    customClassName={{
                      content: "pointer-events-none",
                      item: "mb-3",
                      trigger: "py-2",
                    }}
                  />
                </Form>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </QuestionCommentsContext.Provider>
  );
};

export default Work;
