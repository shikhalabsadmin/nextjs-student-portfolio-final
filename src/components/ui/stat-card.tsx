import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
}

export const StatCard = ({ title, value, icon: Icon }: StatCardProps) => {
  // Function to determine icon color based on title
  const getIconColor = (title: string) => {
    switch (title.toLowerCase()) {
      case 'drafts':
        return 'text-gray-600';  // Gray for drafts
      case 'under review':
        return 'text-yellow-600';  // Yellow for under review
      case 'verified':
        return 'text-green-600';  // Green for verified
      default:
        return 'text-blue-600';  // Blue for total submissions
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="text-2xl font-bold">{value}</div>
        <Icon className={`h-5 w-5 ${getIconColor(title)}`} />
      </CardContent>
    </Card>
  );
}; 