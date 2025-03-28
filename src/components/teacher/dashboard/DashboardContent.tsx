import { useState, useEffect, useMemo, memo } from "react";
import { ArtifactTable, Artifact } from "./ArtifactTable";
import { ArtifactTabFilter, ArtifactFilterTab } from "./ArtifactTabFilter";
import { DashboardHeader } from "./DashboardHeader";
import { TeacherStatusCard } from "./TeacherStatusCard";
import { format } from "date-fns";
import GridPatternBase from "@/components/ui/grid-pattern";
import { useTeacherArtifacts } from "@/hooks/useTeacherArtifacts";
import { Loading } from "@/components/ui/loading";
import { Error } from "@/components/ui/error";
import { User } from "@supabase/supabase-js";
import {
  TeacherDashboardFilters,
  TeachingSubject,
} from "@/types/teacher-dashboard";
import {
  filterArtifacts,
  initializeTeacherFilters,
} from "@/utils/teacher-dashboard-utils";

// Define teacher-specific properties
interface TeacherData {
  grade_levels?: string[];
  teaching_subjects?: TeachingSubject[];
  full_name?: string;
}

// Combined type for the teacher user
type TeacherUser = User & TeacherData;

interface TeacherDataProps {
  user: TeacherUser;
}

// Main dashboard content component
const DashboardContent = ({ user }: TeacherDataProps) => {
  // Ensure user is defined with default values using useMemo
  const safeUser = useMemo(() => user || ({} as TeacherUser), [user]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<ArtifactFilterTab>("All");
  const [selectedFilters, setSelectedFilters] =
    useState<TeacherDashboardFilters>(() =>
      initializeTeacherFilters(safeUser?.teaching_subjects)
    );

  const formattedDate = useMemo(() => format(new Date(), "EEE, MMMM d"), []);

  // Update filters when teaching_subjects change
  useEffect(() => {
    setSelectedFilters(initializeTeacherFilters(safeUser?.teaching_subjects));
  }, [safeUser?.teaching_subjects]);

  // Fetch artifacts from the database
  const { artifacts, isLoading, error, refetch } =
    useTeacherArtifacts(safeUser);

  // Memoize filtered artifacts for better performance
  const filteredArtifacts = useMemo(() => {
    // First filter by tab
    const tabFiltered =
      activeTab === "All"
        ? artifacts || []
        : (artifacts || []).filter(
            (artifact) => artifact?.status === activeTab
          );

    // Then apply search and advanced filters
    return filterArtifacts(
      tabFiltered,
      searchQuery,
      selectedFilters,
      safeUser?.teaching_subjects
    );
  }, [
    artifacts,
    activeTab,
    searchQuery,
    selectedFilters,
    safeUser?.teaching_subjects,
  ]);

  // Handler for artifact clicks
  const handleArtifactClick = (artifact: Artifact) => {
    console.log("Clicked artifact:", artifact);
    // Add additional handling as needed
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-dvh">
        <Loading text="Loading artifacts..." aria-label="Loading artifacts" />
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-dvh">
        <Error
          message={error}
          title="Failed to load artifacts"
          retry={refetch}
          retryButtonText="Retry"
          showHomeButton={false}
        />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col min-h-dvh">
      {/* Grid Pattern Background */}
      <GridPatternBase
        width={40}
        height={40}
        className="absolute inset-0 opacity-40"
        squares={[
          [1, 3],
          [2, 1],
          [5, 2],
          [6, 4],
          [8, 1],
        ]}
      />
      {/* White header section */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 md:gap-0 pt-10 px-8 md:pt-20 md:px-16">
        <div className="space-y-4">
          <span className="text-slate-700 text-lg font-normal">
            {formattedDate}
          </span>
          <h1 className="text-black text-[40px] font-bold">
            Hello, {safeUser?.full_name || "Teacher"}
          </h1>
        </div>
        <div className="bg-white px-6 py-5 rounded-[11px] border border-[#E5E5E5] shadow-sm z-10 relative">
          <TeacherStatusCard artifactCount={artifacts?.length || 0} />
        </div>
      </div>

      {/* Gray background section - fills remaining height */}
      <div className="bg-[#F7F7F7] flex-1 w-full z-10 px-8 md:px-16 mt-5 md:mt-10 flex flex-col gap-4">
        <div className="flex flex-col py-4">
          <h1 className="text-slate-900 text-xl font-semibold">
            Artefact to review
          </h1>
          <p className="text-slate-600 text-sm font-normal">
            Manage and track your academic portfolio
          </p>
        </div>

        <div className="flex flex-col flex-1 gap-3 md:gap-6 pb-10">
          <div className="flex flex-col gap-5 md:gap-0 md:relative">
            <ArtifactTabFilter
              activeTab={activeTab}
              onTabChange={(tab) => {
                setActiveTab(tab);
                setSelectedFilters(
                  initializeTeacherFilters(safeUser?.teaching_subjects || [])
                );
              }}
            />
            <div className="md:absolute md:right-0 md:top-0">
              {" "}
              <DashboardHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                activeTab={activeTab}
                totalItems={filteredArtifacts.length}
                selectedFilters={selectedFilters}
                onFilterChange={setSelectedFilters}
                teachingSubjects={safeUser?.teaching_subjects || []}
              />
            </div>
          </div>

          <div className="flex flex-1 overflow-y-auto overflow-x-hidden">
            {isLoading ? (
              <div className="flex justify-center items-center">
                <Loading
                  text="Loading artifacts..."
                  aria-label="Loading artifacts"
                />
              </div>
            ) : filteredArtifacts.length > 0 ? (
              <ArtifactTable
                artifacts={filteredArtifacts}
                onRowClick={handleArtifactClick}
              />
            ) : (
              <div className="flex flex-col flex-1 justify-center items-center text-center">
                <h3 className="text-lg font-medium text-gray-900">
                  No artifacts found
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {searchQuery.length > 0
                    ? "Try adjusting your search or filters"
                    : "No artifacts match the current filter criteria."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(DashboardContent);
