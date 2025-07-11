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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

  // Handle tab change with proper typing
  const handleTabChange = (value: string) => {
    if (value === "template" || value === "form") {
      setActiveTab(value);
    }
  };

  return (
    <div className="p-4">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        {/* Mobile view pills */}
        <div className="md:hidden mb-4">
          <div className="flex gap-2">
            <Button
              variant={activeTab === "template" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("template")}
              className={cn(
                "flex-1 transition-colors",
                activeTab === "template"
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-slate-700 hover:text-slate-900"
              )}
            >
              Template View
            </Button>
            <Button
              variant={activeTab === "form" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("form")}
              className={cn(
                "flex-1 transition-colors",
                activeTab === "form"
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-slate-700 hover:text-slate-900"
              )}
            >
              Form View
            </Button>
          </div>
        </div>

        {/* Desktop view tabs */}
        <TabsList className="bg-transparent hidden md:flex w-auto h-auto p-0 gap-6 sm:gap-12 px-0 justify-center">
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
          <TabsContent value="template" className="mt-0 p-3 sm:p-6">
            {form ? (
              <PreviewStep form={form} />
            ) : (
              <div className="text-red-500 flex flex-1 justify-center items-center h-full">
                Something went wrong while loading the template view
              </div>
            )}
          </TabsContent>
          <TabsContent value="form" className="mt-0 p-3 sm:p-6">
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
