import { memo } from "react";
import { AssignmentCard } from "@/components/student/dashboard/AssignmentCard";
import { AssignmentsGridProps } from "@/types/student-portfolio";

const MemoizedAssignmentCard = memo(AssignmentCard);

/**
 * Assignments grid component - displays grid of assignment cards
 * 
 * UI Visual:
 * ┌──────────────────────────────────────────────────────────┐
 * │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
 * │  │Assignment│  │Assignment│  │Assignment│              │
 * │  │Card      │  │Card      │  │Card      │              │
 * │  └──────────┘  └──────────┘  └──────────┘              │
 * │                                                        │
 * │  Grid: 1 col (mobile) → 2 col (md) → 3 col (lg)       │
 * └──────────────────────────────────────────────────────────┘
 */
function AssignmentsGrid({ 
  assignments, 
  isBusy, 
  onAssignmentClick, 
  previewMode 
}: AssignmentsGridProps) {
  return (
    <div
      className="mt-36 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8"
      aria-live="polite"
      aria-busy={isBusy}
    >
      {assignments.map((assignment) => (
        <div
          key={assignment.id}
          onClick={() => onAssignmentClick(assignment.id)}
          className={previewMode ? "cursor-pointer" : ""}
        >
          <MemoizedAssignmentCard
            id={assignment.id.toString()}
            title={assignment.title}
            subject={assignment.subject}
            grade={assignment.grade}
            dueDate={new Date(assignment.due_date).toLocaleDateString()}
            status={assignment.status}
            imageUrl={assignment.image_url}
          />
        </div>
      ))}
    </div>
  );
}

export default memo(AssignmentsGrid);
