import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, AlertCircle, Clock, FileText } from "lucide-react";
import { Plus } from "lucide-react";

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'verified':
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case 'submitted':
      return <Clock className="h-5 w-5 text-yellow-600" />;
    case 'draft':
      return <FileText className="h-5 w-5 text-gray-600" />;
    default:
      return <Clock className="h-5 w-5 text-yellow-600" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'verified':
      return 'text-green-600';
    case 'submitted':
      return 'text-yellow-600';
    case 'draft':
      return 'text-gray-600';
    default:
      return 'text-yellow-600';
  }
};

export const RecentActivity = () => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['recentActivity'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      return supabase
        .from('assignments')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
    }
  });

  const quickActions = [
    {
      title: "Submit New Work",
      description: "Create a new assignment submission",
      icon: Plus,
      href: "/app/submit"
    },
    {
      title: "View Submissions",
      description: "See all your submitted work",
      icon: FileText,
      href: "/app/assignments"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {activities?.data?.map((activity) => (
            <div key={activity.id} className="flex items-center gap-4 p-4 border-b">
              {getStatusIcon(activity.status)}
              <div className="flex-1">
                <h3 className="font-medium">{activity.title}</h3>
                <p className="text-sm text-gray-600">{activity.subject}</p>
              </div>
              <span className={`capitalize ${getStatusColor(activity.status)}`}>
                {activity.status === 'submitted' ? 'Under Review' : activity.status}
              </span>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}; 