import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardStats } from "@/components/analytics/DashboardStats";
import { AssignmentsList } from "@/components/assignments/AssignmentsList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/config/routes";

export const StudentAssignments = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("analytics");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleSubmitNew = () => {
    // Add detailed console logging for debugging
    console.log("Starting new assignment creation flow");
    console.log("Clearing localStorage data");
    
    // Clear any stored form data before navigating
    localStorage.removeItem('assignmentFormData');
    localStorage.removeItem('assignmentFormStep');
    localStorage.removeItem('formData');
    localStorage.removeItem('step');
    
    // Generate the target route
    const targetRoute = ROUTES.STUDENT.MANAGE_ASSIGNMENT.replace(':id', 'new');
    console.log("Navigating to new assignment page:", targetRoute);
    
    // Navigate to the new assignment route
    navigate(targetRoute);
  };

  return (
    <div className="container mx-auto py-4 px-3 sm:px-4 mobile-container">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4">My Assignments</h1>
      
      <Tabs defaultValue="analytics" value={activeTab} onValueChange={handleTabChange}>
        {/* Mobile view pills */}
        <div className="md:hidden mb-4">
          <div className="flex gap-2">
            <Button
              variant={activeTab === "analytics" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("analytics")}
              className={cn(
                "flex-1 transition-colors",
                activeTab === "analytics"
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-slate-700 hover:text-slate-900"
              )}
            >
              Analytics
            </Button>
            <Button
              variant={activeTab === "assignments" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("assignments")}
              className={cn(
                "flex-1 transition-colors",
                activeTab === "assignments"
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-slate-700 hover:text-slate-900"
              )}
            >
              Assignments
            </Button>
          </div>
        </div>
        
        {/* Desktop view tabs */}
        <div className="hidden md:block sticky top-0 z-10 bg-white py-2 border-b">
          <TabsList>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="analytics" className="pt-4">
          <DashboardStats />
        </TabsContent>
        
        <TabsContent value="assignments" className="pt-4">
          <AssignmentsList />
          <Button 
            onClick={handleSubmitNew}
            className="bg-[#62C59F] hover:bg-[#51b88e] mt-4"
            size="default"
          >
            <Plus className="w-5 h-5 mr-2" />
            Submit New
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 