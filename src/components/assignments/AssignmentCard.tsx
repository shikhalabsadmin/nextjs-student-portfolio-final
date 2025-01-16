import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AssignmentWithStatus } from '@/types/assignments';

interface Props {
  assignment: AssignmentWithStatus;
  onClick: () => void;
  onDelete: (id: string) => void;
}

export function AssignmentCard({ assignment, onClick, onDelete }: Props) {
  return (
    <Card 
      className="p-4 hover:border-primary transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{assignment.title}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <span>{assignment.subject}</span>
            <span>•</span>
            <span>Grade {assignment.grade}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={assignment.status === 'DRAFT' ? 'secondary' : 'outline'}>
            {assignment.status}
          </Badge>
          {assignment.status === 'DRAFT' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(assignment.id);
              }}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
} 