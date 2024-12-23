import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, Settings } from "lucide-react";

export const QuickActions = () => {
  const navigate = useNavigate();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-4">
        <Button 
          onClick={() => navigate('/submit')}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Submit New Work
        </Button>
        <Button 
          variant="outline"
          onClick={() => navigate('/assignments')}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          View All Assignments
        </Button>
      </CardContent>
    </Card>
  );
}; 