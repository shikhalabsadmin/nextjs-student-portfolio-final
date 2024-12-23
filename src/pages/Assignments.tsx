import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardStats } from "@/components/analytics/DashboardStats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const Assignments = () => {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['assignments', selectedStatus],
    queryFn: async () => {
      let query = supabase
        .from('assignments')
        .select(`
          *,
          profiles:student_id (full_name),
          verifications (
            id,
            status,
            feedback,
            teacher_id,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (selectedStatus) {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Teacher Dashboard</h1>
      
      <Tabs defaultValue="analytics">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="analytics">
          <DashboardStats />
        </TabsContent>
        
        <TabsContent value="assignments">
          <div className="space-y-6">
            <div className="flex gap-2">
              <Button
                variant={selectedStatus === null ? "default" : "outline"}
                onClick={() => setSelectedStatus(null)}
              >
                All
              </Button>
              <Button
                variant={selectedStatus === "pending" ? "default" : "outline"}
                onClick={() => setSelectedStatus("pending")}
              >
                Pending
              </Button>
              <Button
                variant={selectedStatus === "approved" ? "default" : "outline"}
                onClick={() => setSelectedStatus("approved")}
              >
                Approved
              </Button>
              <Button
                variant={selectedStatus === "rejected" ? "default" : "outline"}
                onClick={() => setSelectedStatus("rejected")}
              >
                Rejected
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <div className="grid gap-4">
                {assignments?.map((assignment) => (
                  <Card key={assignment.id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">
                          {assignment.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          Submitted by {assignment.profiles?.full_name} on{" "}
                          {format(new Date(assignment.created_at), "PPP")}
                        </p>
                        <div className="flex gap-2">
                          <Badge variant="secondary">{assignment.subject}</Badge>
                          <Badge variant="secondary">{assignment.artifact_type}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(assignment.status)}
                        <Badge className={getStatusColor(assignment.status)}>
                          {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        onClick={() => window.location.href = `/assignments/${assignment.id}`}
                      >
                        View Details
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Assignments;