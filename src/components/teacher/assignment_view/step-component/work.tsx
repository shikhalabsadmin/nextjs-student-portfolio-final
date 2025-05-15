import React, { useMemo, useState } from "react";
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

// Type for the tab values
type TabType = "template" | "form";

interface WorkProps {
  defaultTab?: TabType;
  form?: UseFormReturn<AssignmentFormValues>;
}

const Work: React.FC<WorkProps> = ({ defaultTab = "template", form }) => {
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);

  // Define accordion sections once
  const formSections = useMemo(
    () => [
      {
        id: "basic-info",
        title: "Basic Information",
        content: <BasicInfoStep form={form} />,
      },
      {
        id: "collaboration",
        title: "Collaboration and Originality",
        content: <CollaborationStep form={form} />,
      },
      {
        id: "skills",
        title: "Skills and Reflection",
        content: <ProcessStep form={form} />,
      },
      {
        id: "process",
        title: "Process and Challenges",
        content: <ReflectionStep form={form} />,
      },
    ],
    [form]
  );

  return (
    <div className="p-4">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabType)}
        className="w-full"
      >
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

        <div className="p-0">
          <TabsContent value="template" className="mt-0 p-6">
            {form ? (
              <PreviewStep form={form} />
            ) : (
              <div className="text-red-500 flex flex-1 justify-center items-center h-full">
                Something went wrong while loading the template view
              </div>
            )}
          </TabsContent>
          <TabsContent value="form" className="mt-0 p-6">
            {form ? (
              <Form {...form}>
                <FormViewAccordion
                  sections={formSections}
                  defaultValue="basic-info"
                  customClassName={{
                    content: "pointer-events-none",
                  }}
                />
              </Form>
            ) : (
              <div className="text-red-500 flex flex-1 justify-center items-center h-full">
                Something went wrong while loading the form view
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Work;
