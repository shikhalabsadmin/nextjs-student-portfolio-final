import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const DashboardStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const { data: assignments } = await supabase
        .from('assignments')
        .select(`
          *,
          verifications (status)
        `);

      const { data: students } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student');

      const totalAssignments = assignments?.length || 0;
      const pendingVerifications = assignments?.filter(a => 
        !a.verifications || a.verifications.length === 0
      ).length || 0;
      const approvedAssignments = assignments?.filter(a => 
        a.verifications?.[0]?.status === 'approved'
      ).length || 0;

      const subjectData = assignments?.reduce((acc, curr) => {
        acc[curr.subject] = (acc[curr.subject] || 0) + 1;
        return acc;
      }, {});

      const chartData = Object.entries(subjectData || {}).map(([subject, count]) => ({
        subject,
        count
      }));

      return {
        totalAssignments,
        pendingVerifications,
        approvedAssignments,
        totalStudents: students?.length || 0,
        chartData
      };
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Students</h3>
          <p className="text-2xl font-bold mt-2">{stats?.totalStudents}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Assignments</h3>
          <p className="text-2xl font-bold mt-2">{stats?.totalAssignments}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Pending Review</h3>
          <p className="text-2xl font-bold mt-2">{stats?.pendingVerifications}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Approved</h3>
          <p className="text-2xl font-bold mt-2">{stats?.approvedAssignments}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Assignments by Subject</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#62C59F" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};