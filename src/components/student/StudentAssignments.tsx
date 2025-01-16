import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardStats } from "@/components/analytics/DashboardStats";
import { AssignmentsList } from "@/components/assignments/AssignmentsList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const StudentAssignments = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">My Assignments</h1>
      
      <Tabs defaultValue="analytics">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="analytics">
          <DashboardStats />
        </TabsContent>
        
        <TabsContent value="assignments">
          <AssignmentsList />
          <Button 
            onClick={() => {
              // Clear any stored form data before navigating
              localStorage.removeItem('assignmentFormData');
              localStorage.removeItem('assignmentFormStep');
              localStorage.removeItem('formData');
              localStorage.removeItem('step');
              navigate('/app/submit');
            }}
            className="bg-[#62C59F] hover:bg-[#51b88e]"
            size="default"
          >
            <Plus className="w-5 h-5 mr-2" />
            Submit New
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
} 