import { Card } from "@/components/ui/card";
import { memo } from "react";

interface TeacherStatusCardProps {
  artifactCount: number;
}

export const TeacherStatusCard = memo(
  ({ artifactCount }: TeacherStatusCardProps) => {
    return (
      <div className="space-y-4">
        <h3 className="text-slate-500 text-sm font-normal">Your Update</h3>
        <div className="bg-red-500 size-6 rounded-full absolute -top-7 left-1/2 -translate-x-1/2" />
        <div className="flex flex-row flex-wrap justify-between items-center text-slate-900 text-xl font-bold gap-1">
          <span> You have </span>
          <span className="text-green-600">
            {artifactCount} student artefacts
          </span>
          <span> to review.</span>
        </div>
      </div>
    );
  }
);
