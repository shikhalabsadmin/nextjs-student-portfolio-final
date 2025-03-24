import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AssignmentStatus, STATUS_COLORS, STATUS_DISPLAY_NAMES, ASSIGNMENT_STATUS } from '@/constants/assignment-status';
import { Subject, GradeLevel } from '@/constants/grade-subjects';
import { Trash2, MoreHorizontal, Edit, Eye, FileDown, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AssignmentCardProps {
  title: string;
  subject: Subject;
  grade: GradeLevel;
  dueDate: string;
  status: AssignmentStatus;
  imageUrl?: string;
  onDelete?: () => void;
}

export function AssignmentCard({ 
  title, 
  subject, 
  grade,
  dueDate, 
  status,
  imageUrl = "/images/chalkboard-math.jpg",
  onDelete
}: AssignmentCardProps) {
  const canDelete = (status: AssignmentStatus): boolean => {
    // Only allow deletion for these statuses
    const deletableStatuses: AssignmentStatus[] = [
      ASSIGNMENT_STATUS.DRAFT,
      ASSIGNMENT_STATUS.IN_PROGRESS,
      ASSIGNMENT_STATUS.OVERDUE
    ];
    return deletableStatuses.includes(status);
  };

  const getDeleteConfirmationMessage = (status: AssignmentStatus): string => {
    switch (status) {
      case ASSIGNMENT_STATUS.DRAFT:
        return "Are you sure you want to delete this draft assignment? This action cannot be undone.";
      case ASSIGNMENT_STATUS.IN_PROGRESS:
        return "Are you sure you want to delete this in-progress assignment? All your work will be lost.";
      case ASSIGNMENT_STATUS.OVERDUE:
        return "Are you sure you want to delete this overdue assignment? You may need to request a new one.";
      default:
        return "Are you sure you want to delete this assignment?";
    }
  };

  const getStatusActions = () => {
    const items = [];
    
    switch (status) {
      case ASSIGNMENT_STATUS.DRAFT:
        items.push(
          <DropdownMenuItem key="start" onClick={() => console.log("Start Assignment")}>
            <Edit className="mr-2 h-4 w-4" />
            Start Assignment
          </DropdownMenuItem>
        );
        items.push(
          <DropdownMenuItem key="instructions" onClick={() => console.log("View Instructions")}>
            <Eye className="mr-2 h-4 w-4" />
            View Instructions
          </DropdownMenuItem>
        );
        break;
        
      case ASSIGNMENT_STATUS.IN_PROGRESS:
        items.push(
          <DropdownMenuItem key="continue" onClick={() => console.log("Continue Working")}>
            <Edit className="mr-2 h-4 w-4" />
            Continue Working
          </DropdownMenuItem>
        );
        items.push(
          <DropdownMenuItem key="save" onClick={() => console.log("Save Draft")}>
            <Clock className="mr-2 h-4 w-4" />
            Save Draft
          </DropdownMenuItem>
        );
        break;
        
      case ASSIGNMENT_STATUS.OVERDUE:
        items.push(
          <DropdownMenuItem key="submit" onClick={() => console.log("Submit Now")}>
            <AlertTriangle className="mr-2 h-4 w-4 text-destructive" />
            <span className="text-destructive">Submit Now</span>
          </DropdownMenuItem>
        );
        items.push(
          <DropdownMenuItem key="extension" onClick={() => console.log("Request Extension")}>
            <Clock className="mr-2 h-4 w-4" />
            Request Extension
          </DropdownMenuItem>
        );
        break;
        
      case ASSIGNMENT_STATUS.NEEDS_REVISION:
        items.push(
          <DropdownMenuItem key="revisions" onClick={() => console.log("Make Revisions")}>
            <Edit className="mr-2 h-4 w-4" />
            Make Revisions
          </DropdownMenuItem>
        );
        items.push(
          <DropdownMenuItem key="feedback" onClick={() => console.log("View Feedback")}>
            <Eye className="mr-2 h-4 w-4" />
            View Feedback
          </DropdownMenuItem>
        );
        break;
        
      case ASSIGNMENT_STATUS.UNDER_REVIEW:
        items.push(
          <DropdownMenuItem key="view" disabled>
            Under Review
          </DropdownMenuItem>
        );
        items.push(
          <DropdownMenuItem key="submission" onClick={() => console.log("View Submission")}>
            <Eye className="mr-2 h-4 w-4" />
            View Submission
          </DropdownMenuItem>
        );
        break;
        
      case ASSIGNMENT_STATUS.SUBMITTED:
        items.push(
          <DropdownMenuItem key="status" disabled>
            Submitted
          </DropdownMenuItem>
        );
        items.push(
          <DropdownMenuItem key="view-submission" onClick={() => console.log("View Submission")}>
            <Eye className="mr-2 h-4 w-4" />
            View Submission
          </DropdownMenuItem>
        );
        break;
        
      case ASSIGNMENT_STATUS.COMPLETED:
      case ASSIGNMENT_STATUS.APPROVED:
        items.push(
          <DropdownMenuItem key="details" onClick={() => console.log("View Details")}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
        );
        items.push(
          <DropdownMenuItem key="certificate" onClick={() => console.log("Download Certificate")}>
            <FileDown className="mr-2 h-4 w-4" />
            Download Certificate
          </DropdownMenuItem>
        );
        break;
        
      case ASSIGNMENT_STATUS.REJECTED:
        items.push(
          <DropdownMenuItem key="resubmit" onClick={() => console.log("Resubmit")}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Resubmit
          </DropdownMenuItem>
        );
        items.push(
          <DropdownMenuItem key="rejected-feedback" onClick={() => console.log("View Feedback")}>
            <Eye className="mr-2 h-4 w-4" />
            View Feedback
          </DropdownMenuItem>
        );
        break;
    }
    
    // Add delete option for applicable statuses
    if (canDelete(status)) {
      items.push(<DropdownMenuSeparator key="separator" />);
      items.push(
        <AlertDialog key="delete-dialog">
          <AlertDialogTrigger asChild>
            <DropdownMenuItem 
              key="delete"
              className="text-destructive"
              onSelect={(e) => e.preventDefault()}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Assignment
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
              <AlertDialogDescription>
                {getDeleteConfirmationMessage(status)}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }
    
    return items;
  };

  return (
    <Card className="group overflow-hidden rounded-xl border border-[#EAECF0] hover:border-[#D0D5DD] hover:shadow-[0px_4px_8px_-2px_rgba(16,24,40,0.1),0px_2px_4px_-2px_rgba(16,24,40,0.06)] transition-all duration-200">
      {/* Image Section */}
      <div className="relative h-[180px] overflow-hidden border-b border-[#EAECF0]">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
        <Badge 
          className={cn(
            "absolute bottom-3 left-3 font-medium px-2.5 py-0.5 text-xs rounded-full",
            STATUS_COLORS[status]
          )}
        >
          {STATUS_DISPLAY_NAMES[status]}
        </Badge>
      </div>

      {/* Content Section */}
      <div className="p-4 relative">
        {/* Main content - Always visible */}
        <div>
          <h3 className="font-semibold text-base text-[#101828] line-clamp-2 mb-2">{title}</h3>
          <div className="flex items-center text-sm text-[#475467] gap-1">
            <span>{dueDate}</span>
            <span className="text-[#98A2B3]">•</span>
            <span>{subject}</span>
            <span className="text-[#98A2B3]">•</span>
            <span>Grade {grade}</span>
          </div>
        </div>
        
        {/* Three Dots Menu - visible on hover */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full bg-white shadow-sm hover:bg-gray-100"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1">
              {getStatusActions()}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
} 