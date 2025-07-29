import { Card } from "@/components/ui/card";
import { memo } from "react";

interface TeacherStatusCardProps {
  artifactCount: number;
}

export const TeacherStatusCard = memo(
  ({ artifactCount }: TeacherStatusCardProps) => {
    return (
      <Card className="relative overflow-hidden">
        {/* Mobile version (shown only on small screens) */}
        <div className="block sm:hidden px-3 py-2 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <h3 className="text-slate-500 text-xs font-medium">Your Update</h3>
            <div className="flex items-center">
              <span className="bg-green-500 h-2 w-2 rounded-full mr-1.5" />
              <span className="text-xs text-slate-500">Now</span>
            </div>
          </div>
          
          <p className="text-sm font-medium text-slate-800 mt-1">
            <span className="text-green-600 font-semibold">{artifactCount}</span> student {artifactCount === 1 ? 'work' : 'works'} waiting for review
          </p>
        </div>

        {/* Desktop version - more compact (hidden on small screens) */}
        <div className="hidden sm:block p-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-slate-500 text-xs font-medium">Your Update</h3>
            <div className="flex items-center">
              <span className="bg-green-500 h-2 w-2 rounded-full mr-1" />
              <span className="text-xs text-slate-500">Now</span>
            </div>
          </div>
          <p className="text-base font-medium text-slate-800">
            <span className="text-green-600 font-semibold">{artifactCount}</span> student {artifactCount === 1 ? 'work' : 'works'} waiting for review
          </p>
        </div>
      </Card>
    );
  }
);
