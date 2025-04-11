import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { StudentDashboardFilters } from '@/types/student-dashboard';
import { ASSIGNMENT_STATUS, STATUS_DISPLAY_NAMES } from '@/constants/assignment-status';
import { Subject, GradeLevel } from '@/constants/grade-subjects';
import { spacesToCamelCase } from '@/utils/string-utils';
import { getActiveStudentFilterCount } from '@/utils/student-dashboard-utils';
import { ROUTES } from '@/config/routes';

/**
 * Props for the DashboardHeader component
 */
interface DashboardHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedFilters: StudentDashboardFilters;
  onFilterChange: (filters: StudentDashboardFilters) => void;
  availableSubjects: Subject[];
  currentGrade: GradeLevel;
}

/**
 * Header component for the student dashboard with search, filter, and add functionality
 */
export function DashboardHeader({
  searchQuery,
  onSearchChange,
  selectedFilters,
  onFilterChange,
  availableSubjects,
  currentGrade
}: DashboardHeaderProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<StudentDashboardFilters>(selectedFilters);

  // Calculate active filter count for the filter badge
  const activeFilterCount = useMemo(() => 
    getActiveStudentFilterCount(selectedFilters),
    [selectedFilters]
  );

  /**
   * Handles toggling a filter value
   */
  const handleFilterChange = (filterKey: string) => {
    setTempFilters(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey as keyof StudentDashboardFilters]
    }));
  };

  /**
   * Applies current filter selection and closes the dialog
   */
  const handleApplyFilters = () => {
    onFilterChange(tempFilters);
    setIsOpen(false);
  };

  /**
   * Clears all filters and closes the dialog
   */
  const handleClearFilters = () => {
    const clearedFilters: StudentDashboardFilters = Object.keys(selectedFilters).reduce(
      (acc, key) => ({ ...acc, [key]: false }),
      {} as StudentDashboardFilters
    );
    setTempFilters(clearedFilters);
    onFilterChange(clearedFilters);
    setIsOpen(false);
  };

  /**
   * Handles dialog open/close events and resets temp filters
   */
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setTempFilters(selectedFilters);
    }
  };

  /**
   * Navigates to assignment creation page
   */
  const handleAddAssignment = () => {
    navigate(ROUTES.STUDENT.MANAGE_ASSIGNMENT.replace(':id?', ''));
  };

  return (
    <div className="flex justify-end">
      <TooltipProvider>
        <div className="flex flex-col lg:flex-row lg:items-center gap-5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Input
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search by artefacts name, Subject"
                  className="pl-10 w-full lg:w-80"
                  aria-label="Search artefacts"
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Search artefacts</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          {/* Filter Dialog */}
          <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filter
                    {activeFilterCount > 0 && (
                      <span className="ml-1 bg-[#4F46E5] text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Filter artefacts</p>
              </TooltipContent>
            </Tooltip>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Filter Artefacts by Status and Subject</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                {/* Status Filters */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Status</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(ASSIGNMENT_STATUS).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox 
                          id={value}
                          checked={tempFilters[value.toLowerCase() as keyof StudentDashboardFilters]}
                          onCheckedChange={() => handleFilterChange(value.toLowerCase())}
                        />
                        <Label htmlFor={value}>{STATUS_DISPLAY_NAMES[value]}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subject Filters */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Subject</h3>
                  {availableSubjects && availableSubjects.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {availableSubjects.map((subject) => (
                        <div key={subject} className="flex items-center space-x-2">
                          <Checkbox 
                            id={subject}
                            checked={tempFilters[spacesToCamelCase(subject) as keyof StudentDashboardFilters]}
                            onCheckedChange={() => handleFilterChange(spacesToCamelCase(subject))}
                          />
                          <Label htmlFor={subject}>{subject}</Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic">No subjects available for current grade</div>
                  )}
                </div>
              </div>
              
              {/* Filter Dialog Footer */}
              <DialogFooter className="flex flex-row justify-between lg:justify-between items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClearFilters}
                      className="w-[120px]"
                    >
                      Clear All
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clear all filters</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      onClick={handleApplyFilters}
                      className="w-[120px]"
                    >
                      Apply Filters
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Apply selected filters</p>
                  </TooltipContent>
                </Tooltip>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Add Assignment Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={handleAddAssignment}
                variant="default"
                size="icon"
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg shadow-md"
              >
                <Plus className="h-5 w-5" />
                <span className="sr-only">Add</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create New Artefact</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
} 