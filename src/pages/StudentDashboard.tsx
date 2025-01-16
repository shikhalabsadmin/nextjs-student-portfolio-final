import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BarChart, 
  CheckCircle2, 
  Clock, 
  FileText, 
  PieChart,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/ui/stat-card";
import { RecentActivity } from "@/components/dashboard/RecentActivity";

export default function StudentDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['assignment-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data: assignments } = await supabase
        .from('assignments')
        .select('status')
        .eq('student_id', user.id);

      console.log('Raw assignments:', assignments);

      const counts = {
        total: assignments?.filter(a => a.status === 'SUBMITTED' || a.status === 'VERIFIED').length || 0,
        drafts: assignments?.filter(a => a.status === 'DRAFT').length || 0,
        verified: assignments?.filter(a => a.status === 'verified').length || 0,
        underReview: assignments?.filter(a => a.status === 'SUBMITTED').length || 0
      };

      console.log('Calculated counts:', counts);
      return counts;
    }
  });

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Submissions" 
          value={stats?.total || 0} 
          icon={FileText} 
        />
        <StatCard 
          title="Drafts" 
          value={stats?.drafts || 0} 
          icon={FileText} 
        />
        <StatCard 
          title="Under Review" 
          value={stats?.underReview || 0} 
          icon={Clock} 
        />
        <StatCard 
          title="Verified" 
          value={stats?.verified || 0} 
          icon={CheckCircle2} 
        />
      </div>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
}