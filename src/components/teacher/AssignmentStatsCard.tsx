import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Edit2, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface AssignmentStatsCardProps {
  topic: string;
  subject: string;
  grade_levels: string[];
  submissionCount: number;
  verificationCount: number;
  teacherCreatedCount: number;
  studentInitiatedCount: number;
  description: string | null;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function AssignmentStatsCard({
  topic,
  subject,
  grade_levels,
  submissionCount,
  verificationCount,
  teacherCreatedCount,
  studentInitiatedCount,
  description,
  onClick,
  onEdit,
  onDelete,
}: AssignmentStatsCardProps) {
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <Card
      className="p-6 cursor-pointer hover:border-primary transition-colors"
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h3 className="font-medium text-lg">{topic}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{subject}</span>
            <span>•</span>
            <span>{grade_levels.join(', ')}</span>
          </div>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary">
              {teacherCreatedCount} Teacher Created
            </Badge>
            <Badge variant="secondary">
              {studentInitiatedCount} Student Initiated
            </Badge>
            <Badge variant="secondary">
              {submissionCount} Submissions
            </Badge>
            <Badge variant="secondary">
              {verificationCount} Verified
            </Badge>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={stopPropagation}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={stopPropagation} onSelect={onEdit}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={stopPropagation}
              onSelect={onDelete}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
} 