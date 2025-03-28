import React, { memo } from "react";
import { cn } from "@/lib/utils";
import { ASSIGNMENT_STATUS, STATUS_DISPLAY_NAMES, AssignmentStatus } from "@/constants/assignment-status";

export type ArtifactFilterTab = "All" | AssignmentStatus;

interface ArtifactTabFilterProps {
  activeTab: ArtifactFilterTab;
  onTabChange: (tab: ArtifactFilterTab) => void;
}

export const ArtifactTabFilter = memo(({ activeTab, onTabChange }: ArtifactTabFilterProps) => {
  const tabs: ArtifactFilterTab[] = [
    "All",
    ASSIGNMENT_STATUS.UNDER_REVIEW,
    ASSIGNMENT_STATUS.NEEDS_REVISION,
    ASSIGNMENT_STATUS.APPROVED,
    ASSIGNMENT_STATUS.SUBMITTED
  ];

  // Get display name for a tab
  const getTabDisplayName = (tab: ArtifactFilterTab): string => {
    if (tab === "All") {
      return "All";
    }
    // Use STATUS_DISPLAY_NAMES for status tabs
    return STATUS_DISPLAY_NAMES[tab];
  };

  return (
    <div className="border-b border-slate-300">
      <div className="flex justify-between items-center">
        <nav className="-mb-px flex space-x-12 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={cn(
                "whitespace-nowrap py-4 border-b-2 text-sm font-normal transition-colors cursor-pointer",
                activeTab === tab
                  ? "border-black text-black font-semibold"
                  : "border-transparent text-slate-900"
              )}
            >
              {getTabDisplayName(tab)}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
});

ArtifactTabFilter.displayName = 'ArtifactTabFilter'; 