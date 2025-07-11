import { memo } from "react";
import { cn } from "@/lib/utils";
import { ASSIGNMENT_STATUS, STATUS_DISPLAY_NAMES } from "@/constants/assignment-status";
import { Button } from "@/components/ui/button";

export type ArtifactFilterTab = "All" | keyof typeof ASSIGNMENT_STATUS;

interface ArtifactTabFilterProps {
  activeTab: ArtifactFilterTab;
  onTabChange: (tab: ArtifactFilterTab) => void;
}

export const ArtifactTabFilter = memo(({ activeTab, onTabChange }: ArtifactTabFilterProps) => {
  const tabs: ArtifactFilterTab[] = [
    "All",
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
    <div className="w-full">
      {/* Mobile pill view */}
      <div className="md:hidden py-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 min-w-max px-1">
          {tabs.map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "outline"}
              size="sm"
              onClick={() => onTabChange(tab)}
              className={cn(
                "whitespace-nowrap transition-colors",
                activeTab === tab
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-slate-700 hover:text-slate-900"
              )}
            >
              {getTabDisplayName(tab)}
            </Button>
          ))}
        </div>
      </div>

      {/* Desktop tabs view */}
      <div className="hidden md:block border-b border-slate-300">
        <nav className="-mb-px flex space-x-8 md:space-x-12" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={cn(
                "whitespace-nowrap py-3 md:py-4 border-b-2 text-sm font-normal transition-colors cursor-pointer",
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