import { memo } from "react";
import { Backpack, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileInfoProps } from "@/types/student-portfolio";

/**
 * Profile info component - displays name, grade, and school
 * 
 * UI Visual:
 * ┌─────────────────────────────────────┐
 * │  saurav.kumar        ← title        │
 * │  🎒 A2  🎓 Shikha Academy ← badges  │
 * └─────────────────────────────────────┘
 * 
 * @example
 * <ProfileInfo 
 *   name="John" 
 *   grade="A2" 
 *   schoolName="School"
 *   classNames={{
 *     container: "bg-white p-4",
 *     title: "text-blue-600",
 *     badgeContainer: "gap-4",
 *     badge: "text-xs"
 *   }}
 * />
 */
function ProfileInfo({ name, grade, schoolName, classNames }: ProfileInfoProps) {
  return (
    <div className={cn("", classNames?.container)}>
      <h3 className={cn(
        "mt-5 text-3xl font-bold text-gray-900 tracking-tight",
        classNames?.title
      )}>
        {name}
      </h3>

      <div className={cn(
        "mt-4 flex flex-wrap items-center gap-6",
        classNames?.badgeContainer
      )}>
        {grade && (
          <div className={cn(
            "flex items-center gap-1 text-slate-700",
            classNames?.badge
          )}>
            <Backpack className="h-4 w-4" />
            <span>{grade}</span>
          </div>
        )}
        {schoolName && (
          <div className={cn(
            "flex items-center gap-1 text-slate-700",
            classNames?.badge
          )}>
            <GraduationCap className="h-4 w-4" />
            <span>{schoolName}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(ProfileInfo);
