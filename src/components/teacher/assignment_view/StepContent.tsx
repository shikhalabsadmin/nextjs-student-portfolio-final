import { useState, useCallback, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { AssignmentFormValues, FeedbackItem } from "@/lib/validations/assignment";
import { ASSIGNMENT_STATUS } from "@/constants/assignment-status";
import Work from "@/components/teacher/assignment_view/step-component/work";
import Feedback from "@/components/teacher/assignment_view/step-component/Feedback";
import { cn } from "@/lib/utils";

interface StepContentProps {
  activeStep: number;
  form?: UseFormReturn<AssignmentFormValues>;
  feedbackItems: FeedbackItem[];
  isApproved: boolean;
  isRevisionRequested: boolean;
  onApprove: () => void;
  onRequestRevision: () => void;
}

const StepContent = ({
  activeStep,
  form,
  feedbackItems,
  isApproved,
  isRevisionRequested,
  onApprove,
  onRequestRevision,
}: StepContentProps) => {
  const [activeTab, setActiveTab] = useState<"work" | "feedback">("work");

  // Determine button state based on assignment status
  const showActionButtons = useMemo(() => {
    if (!form) return false;

    const status = form.getValues("status");
    return status === ASSIGNMENT_STATUS.SUBMITTED;
  }, [form]);

  // Handle tab change with proper typing
  const handleTabChange = (value: string) => {
    if (value === "work" || value === "feedback") {
      setActiveTab(value);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Tabs
        defaultValue="work"
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full h-full flex flex-col"
      >
        {/* Mobile view pills */}
        <div className="md:hidden border-b border-slate-200 p-2">
          <div className="flex gap-2">
            <Button
              variant={activeTab === "work" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("work")}
              className={cn(
                "flex-1 transition-colors",
                activeTab === "work"
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-slate-700 hover:text-slate-900"
              )}
            >
              Student Work
            </Button>
            <Button
              variant={activeTab === "feedback" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("feedback")}
              className={cn(
                "flex-1 transition-colors",
                activeTab === "feedback"
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-slate-700 hover:text-slate-900"
              )}
            >
              Your Feedback
            </Button>
          </div>
        </div>

        {/* Desktop view tabs */}
        <div className="border-b border-slate-200 hidden md:block">
          <TabsList className="h-auto bg-white p-0 mb-0">
            <TabsTrigger
              value="work"
              className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none rounded-none px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium"
            >
              Student Work
            </TabsTrigger>
            <TabsTrigger
              value="feedback"
              className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none rounded-none px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium"
            >
              Your Feedback
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto">
          <TabsContent
            value="work"
            className="p-0 m-0 h-full flex flex-col"
          >
            <div className="flex-1 overflow-auto">
              <Work form={form} />
            </div>
          </TabsContent>

          <TabsContent
            value="feedback"
            className="p-0 m-0 h-full flex flex-col"
          >
            <div className="flex-1 overflow-auto p-2 sm:p-4">
              <Feedback 
                form={form!} 
                feedbackItems={feedbackItems}
              />
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Status and action buttons */}
      {showActionButtons && (
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 p-3 sm:p-4 border-t border-slate-200 bg-slate-50">
          <Button
            variant="outline"
            onClick={onRequestRevision}
            disabled={isApproved || isRevisionRequested}
            className="w-full sm:w-auto"
          >
            Request Revision
          </Button>
          <Button
            onClick={onApprove}
            disabled={isApproved || isRevisionRequested}
            className="bg-[#6366F1] hover:bg-[#6366F1]/90 text-white w-full sm:w-auto"
          >
            Approve
          </Button>
        </div>
      )}
    </div>
  );
};

export default StepContent;

