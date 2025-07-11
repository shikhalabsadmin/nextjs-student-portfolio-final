import React, { useMemo, useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssignmentFormValues } from "@/lib/validations/assignment";
import { PreviewStep } from "@/components/assignment/steps/PreviewStep";
import { UseFormReturn } from "react-hook-form";
import { BasicInfoStep } from "@/components/assignment/steps/BasicInfoStep";
import { CollaborationStep } from "@/components/assignment/steps/CollaborationStep";
import { ProcessStep } from "@/components/assignment/steps/ProcessStep";
import { ReflectionStep } from "@/components/assignment/steps/ReflectionStep";
import { FormViewAccordion } from "@/components/ui/form-view-accordion";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Type for the tab values
type TabType = "template" | "form";

interface WorkProps {
  form?: UseFormReturn<AssignmentFormValues>;
  initialStep?: number;
}

const Work: React.FC<WorkProps> = ({ form, initialStep = 0 }) => {
  const [activeTab, setActiveTab] = useState<TabType>("form"); // Default to form view
  const [activeSection, setActiveSection] = useState<string>("basic-info");
  
  // References to accordion sections for scrolling
  const basicInfoRef = useRef<HTMLDivElement>(null);
  const filesRef = useRef<HTMLDivElement>(null);
  const reflectionRef = useRef<HTMLDivElement>(null);

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
            <BasicInfoStep form={form} />
          </div>
        ),
      },
      {
        id: "files",
        title: "Files & Links",
        content: (
          <div ref={filesRef}>
            <CollaborationStep form={form} />
            <ProcessStep form={form} />
          </div>
        ),
      },
      {
        id: "reflection",
        title: "Reflection",
        content: (
          <div ref={reflectionRef}>
            <ReflectionStep form={form} />
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
    <div className="flex flex-col h-full">
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
            className="m-0 h-full overflow-auto"
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
  );
};

export default Work;
