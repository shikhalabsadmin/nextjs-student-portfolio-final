import { memo } from "react";
import { Backpack, GraduationCap } from "lucide-react";
import { ProfileInfoProps } from "@/types/student-portfolio";

/**
 * Profile info component - displays name, grade, and school
 * 
 * UI Visual:
 * ┌─────────────────────────────────────┐
 * │  saurav.kumar        ← h3 heading   │
 * │  🎒 A2  🎓 Shikha Academy           │
 * └─────────────────────────────────────┘
 */
function ProfileInfo({ name, grade, schoolName }: ProfileInfoProps) {
  return (
    <div>
      <h3 className="mt-5 text-3xl font-bold text-gray-900 tracking-tight">
        {name}
      </h3>

      <div className="mt-4 flex flex-wrap items-center gap-6">
        {grade && (
          <div className="flex items-center gap-1 text-slate-700">
            <Backpack className="h-4 w-4" />
            <span>{grade}</span>
          </div>
        )}
        {schoolName && (
          <div className="flex items-center gap-1 text-slate-700">
            <GraduationCap className="h-4 w-4" />
            <span>{schoolName}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(ProfileInfo);
