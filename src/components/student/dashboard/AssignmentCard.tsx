import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AssignmentStatus, STATUS_COLORS, STATUS_DISPLAY_NAMES, ASSIGNMENT_STATUS } from '@/constants/assignment-status';
import { Subject, GradeLevel } from '@/constants/grade-subjects';
import { Trash2 } from 'lucide-react';
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

  const DeleteButton = () => {
    if (!canDelete(status)) return null;

    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
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
  };

  const getStatusActions = () => {
    switch (status) {
      case ASSIGNMENT_STATUS.DRAFT:
        return (
          <div className="flex gap-2">
            <Button variant="default" size="sm" className="flex-1">
              Start Assignment
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              View Instructions
            </Button>
            <DeleteButton />
          </div>
        );
      case ASSIGNMENT_STATUS.IN_PROGRESS:
        return (
          <div className="flex gap-2">
            <Button variant="default" size="sm" className="flex-1">
              Continue Working
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              Save Draft
            </Button>
            <DeleteButton />
          </div>
        );
      case ASSIGNMENT_STATUS.OVERDUE:
        return (
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" className="flex-1">
              Submit Now
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              Request Extension
            </Button>
            <DeleteButton />
          </div>
        );
      case ASSIGNMENT_STATUS.NEEDS_REVISION:
        return (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="flex-1">
              Make Revisions
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              View Feedback
            </Button>
          </div>
        );
      case ASSIGNMENT_STATUS.UNDER_REVIEW:
        return (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" disabled>
              Under Review
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              View Submission
            </Button>
          </div>
        );
      case ASSIGNMENT_STATUS.SUBMITTED:
        return (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" disabled>
              Submitted
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              View Submission
            </Button>
          </div>
        );
      case ASSIGNMENT_STATUS.COMPLETED:
      case ASSIGNMENT_STATUS.APPROVED:
        return (
          <div className="flex gap-2">
            <Button variant="default" size="sm" className="flex-1">
              View Details
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              Download Certificate
            </Button>
          </div>
        );
      case ASSIGNMENT_STATUS.REJECTED:
        return (
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" className="flex-1">
              Resubmit
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              View Feedback
            </Button>
          </div>
        );
      default:
        return null;
    }
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
        <div className="group-hover:opacity-0 transition-opacity duration-200">
          <h3 className="font-semibold text-base text-[#101828] line-clamp-2 mb-2">{title}</h3>
          <div className="flex items-center text-sm text-[#475467] gap-1">
            <span>{dueDate}</span>
            <span className="text-[#98A2B3]">•</span>
            <span>{subject}</span>
            <span className="text-[#98A2B3]">•</span>
            <span>Grade {grade}</span>
          </div>
        </div>
        <div className="absolute inset-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {getStatusActions()}
        </div>
      </div>
    </Card>
  );
} 