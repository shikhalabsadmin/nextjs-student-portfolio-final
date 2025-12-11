import { memo } from "react";
import { cn } from "@/lib/utils";
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
 * 
 * @example
 * <AssignmentsGrid 
 *   assignments={[...]} 
 *   classNames={{
 *     container: "gap-8",      // Override grid gap
 *     cardWrapper: "shadow-lg" // Add shadow to card wrapper
 *   }}
 * />
 */
function AssignmentsGrid({ 
  assignments, 
  isBusy, 
  onAssignmentClick, 
  previewMode,
  classNames 
}: AssignmentsGridProps) {
  return (
    <div
      className={cn(
        "mt-36 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8",
        classNames?.container
      )}
      aria-live="polite"
      aria-busy={isBusy}
    >
      {assignments.map((assignment) => (
        <div
          key={assignment.id}
          onClick={() => onAssignmentClick(assignment.id)}
          className={cn(
            previewMode ? "cursor-pointer" : "",
            classNames?.cardWrapper
          )}
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
