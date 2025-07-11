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
import { SearchX } from "lucide-react";
import { ROUTES } from "@/config/routes";
import { useNavigate } from "react-router-dom";
import { ASSIGNMENT_STATUS } from "@/constants/assignment-status";

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
  const navigate = useNavigate();

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

  const unApprovedArtifacts = useMemo(() => artifacts?.filter((artifact) => artifact?.status !== ASSIGNMENT_STATUS.APPROVED), [artifacts]);
  const uniquesStudentsCount = useMemo(() => new Set(unApprovedArtifacts?.map((artifact) => artifact?.student_id)).size, [unApprovedArtifacts]);

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
    console.log("Artifact ID type:", typeof artifact.id);
    
    // Ensure ID is a string
    const stringId = String(artifact.id);
    console.log("Converted ID:", stringId);
    
    if (artifact.status === ASSIGNMENT_STATUS.APPROVED) {
      // For approved assignments, navigate to the assignment detail page
      const detailUrl = ROUTES.withParams(ROUTES.ASSIGNMENT.DETAIL, { id: stringId });
      console.log("Navigating to detail URL:", detailUrl);
      navigate(detailUrl);
    } else {
      // For other assignments, navigate to the teacher assignment management page
      const manageUrl = ROUTES.withParams(ROUTES.TEACHER.MANAGE_ASSIGNMENT, { id: stringId });
      console.log("Navigating to manage URL:", manageUrl);
      navigate(manageUrl);
    }
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
        width={20}
        height={20}
        className="absolute inset-0 opacity-40"
        squares={[
          [1, 3],
          [2, 1],
          [5, 2],
          [6, 4],
          [8, 1],
        ]}
      />
      {/* Compact header section with teacher info and status card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 md:gap-3 pt-2 sm:pt-3 md:pt-4 px-4 sm:px-8 md:px-16 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div>
            <span className="text-slate-700 text-sm font-normal block">
              {formattedDate}
            </span>
            <h1 className="text-black text-xl sm:text-2xl font-bold">
              Hello, {safeUser?.full_name || "Teacher"}
            </h1>
          </div>
        </div>
        <div className="bg-white rounded-[8px] border border-[#E5E5E5] shadow-sm z-10 relative w-full sm:w-auto">
          <TeacherStatusCard artifactCount={uniquesStudentsCount || 0} />
        </div>
      </div>

      {/* Gray background section - fills remaining height */}
      <div className="bg-[#F7F7F7] flex-1 w-full z-10 px-4 sm:px-8 md:px-16 pt-3 flex flex-col gap-2">
        <div className="flex flex-col py-2">
          <h1 className="text-slate-900 text-lg font-semibold">
            Work to review
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm font-normal">
            Manage and track your academic portfolio
          </p>
        </div>

        {/* Fixed search and filter section */}
        <div className="sticky top-0 z-20 bg-[#F7F7F7] bg-opacity-95 backdrop-blur-sm pt-1 pb-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <ArtifactTabFilter
              activeTab={activeTab}
              onTabChange={(tab) => {
                setActiveTab(tab);
                setSelectedFilters(
                  initializeTeacherFilters(safeUser?.teaching_subjects || [])
                );
              }}
            />
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

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center flex-1">
              <Loading
                text="Loading artifacts..."
                aria-label="Loading artifacts"
              />
            </div>
          ) : filteredArtifacts.length > 0 ? (
            <ArtifactTable
              artifacts={filteredArtifacts}
              onRowClick={handleArtifactClick}
              searchQuery={searchQuery}
            />
          ) : (
            <div className="flex flex-col flex-1 justify-center items-center text-center min-h-[200px] sm:min-h-[300px]">
              <SearchX className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mb-2 sm:mb-2.5" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900">
                No artifacts found
              </h3>
              <p className="mt-2 sm:mt-2.5 text-xs sm:text-sm text-gray-500">
                {searchQuery.length > 0
                  ? "Try adjusting your search or filters"
                  : "No artifacts match the current filter criteria."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(DashboardContent);
