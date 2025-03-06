import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AssignmentStatus, STATUS_COLORS, STATUS_DISPLAY_NAMES } from '@/constants/assignment-status';
import { Subject, GradeLevel } from '@/constants/grade-subjects';

interface AssignmentCardProps {
  title: string;
  subject: Subject;
  grade: GradeLevel;
  dueDate: string;
  status: AssignmentStatus;
  imageUrl?: string;
}

export function AssignmentCard({ 
  title, 
  subject, 
  grade,
  dueDate, 
  status,
  imageUrl = "/images/chalkboard-math.jpg" // Default to chalkboard image
}: AssignmentCardProps) {
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
      <div className="p-4">
        <h3 className="font-semibold text-base text-[#101828] line-clamp-2 mb-2">{title}</h3>
        <div className="flex items-center text-sm text-[#475467] gap-1">
          <span>{dueDate}</span>
          <span className="text-[#98A2B3]">•</span>
          <span>{subject}</span>
          <span className="text-[#98A2B3]">•</span>
          <span>Grade {grade}</span>
        </div>
      </div>
    </Card>
  );
} 