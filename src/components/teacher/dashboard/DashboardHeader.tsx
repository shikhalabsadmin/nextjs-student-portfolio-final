import { memo } from "react";
import { SearchInput } from "@/components/ui/search-input";
import { ArtifactFilterTab } from "./ArtifactTabFilter";
import {
  TeacherDashboardFilters,
  TeachingSubject,
} from "@/types/teacher-dashboard";
import {
  getActiveFilterCount,
  getUniqueGradesFromTeachingSubjects,
} from "@/utils/teacher-dashboard-utils";
import { FilterDialog } from "./FilterDialog";

// Main component props
interface DashboardHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeTab: ArtifactFilterTab;
  totalItems: number;
  selectedFilters: TeacherDashboardFilters;
  onFilterChange: (filters: TeacherDashboardFilters) => void;
  teachingSubjects?: TeachingSubject[];
}

export const DashboardHeader = memo(({
  searchQuery,
  onSearchChange,
  activeTab,
  totalItems,
  selectedFilters,
  onFilterChange,
  teachingSubjects,
}: DashboardHeaderProps) => {
  const activeFilterCount = getActiveFilterCount(selectedFilters);

  // Get all grades from teaching subjects
  const allGrades = getUniqueGradesFromTeachingSubjects(teachingSubjects);
  const hasFilters = allGrades.length > 0;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-2 sm:gap-3 w-full">
      <FilterDialog
        activeFilterCount={activeFilterCount}
        selectedFilters={selectedFilters}
        onFilterChange={onFilterChange}
        allGrades={allGrades}
        teachingSubjects={teachingSubjects}
        hasFilters={hasFilters}
      />
      
      <div className="relative w-full sm:w-auto sm:flex-initial">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search works"
          className="w-full text-sm h-9 sm:h-10 sm:w-[220px] md:w-[280px] lg:w-[350px]"
        />
      </div>
    </div>
  );
});

DashboardHeader.displayName = 'DashboardHeader'; 