import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, Calendar, Clock, Filter as FilterIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { StudentDashboardFilters, TimePeriod, DateRange } from '@/types/student-dashboard';
import { ASSIGNMENT_STATUS, STATUS_DISPLAY_NAMES } from '@/constants/assignment-status';
import { Subject, GradeLevel } from '@/constants/grade-subjects';
import { spacesToCamelCase } from '@/utils/string-utils';
import { getActiveStudentFilterCount } from '@/utils/student-dashboard-utils';
import { ROUTES } from '@/config/routes';
import { FILTER_MONTHS } from "@/constants/months-filter";

// Time period options for quick filtering
const TIME_PERIODS: { value: TimePeriod; label: string; description: string }[] = [
  { value: 'last7days', label: 'Last 7 Days', description: 'Work submitted in the past week' },
  { value: 'last30days', label: 'Last 30 Days', description: 'Work submitted in the past month' },
  { value: 'last3months', label: 'Last 3 Months', description: 'Work submitted in the past quarter' },
  { value: 'thisYear', label: 'This Year', description: 'Work submitted this academic year' },
  { value: 'custom', label: 'Custom Range', description: 'Choose specific date range' },
];

// Helper function to get date range for time period
const getDateRangeForPeriod = (period: TimePeriod): DateRange | undefined => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'last7days':
      return {
        from: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        to: today
      };
    case 'last30days':
      return {
        from: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
        to: today
      };
    case 'last3months':
      return {
        from: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000),
        to: today
      };
    case 'thisYear':
      return {
        from: new Date(now.getFullYear(), 0, 1),
        to: today
      };
    default:
      return undefined;
  }
};

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
   * Handles toggling a filter value for status and subject filters
   */
  const handleFilterChange = (filterKey: string) => {
    setTempFilters(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey as keyof StudentDashboardFilters]
    }));
  };

  /**
   * Handles time period filter changes
   */
  const handleTimePeriodChange = (period: TimePeriod) => {
    const dateRange = getDateRangeForPeriod(period);
    setTempFilters((prev) => ({
      ...prev,
      timePeriod: period,
      dateRange: period !== 'custom' ? dateRange : prev.dateRange,
    }));
  };

  /**
   * Handles custom date range changes
   */
  const handleCustomDateChange = (field: 'from' | 'to', date: Date | undefined) => {
    setTempFilters((prev) => ({
      ...prev,
      timePeriod: 'custom',
      dateRange: {
        ...prev.dateRange,
        [field]: date,
      },
    }));
  };

  const handleMonthFilterChange = (month: string) => {
    setTempFilters((prev) => ({
      ...prev,
      months: {
        ...prev.months,
        [month]: !prev.months?.[month],
      },
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
      (acc, key) => {
        // Skip dateRange, timePeriod, and months as they're not boolean
        if (key === 'dateRange' || key === 'timePeriod') {
          return { ...acc, [key]: undefined };
        }
        if (key === 'months') {
          return { 
            ...acc, 
            [key]: FILTER_MONTHS.reduce(
              (monthAcc, month) => ({ ...monthAcc, [month]: false }),
              {} as Record<string, boolean>
            )
          };
        }
        return { ...acc, [key]: false };
      },
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
    navigate(ROUTES.STUDENT.MANAGE_ASSIGNMENT);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <h1 className="text-xl sm:text-2xl font-bold">My Works</h1>
      
      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto sm:flex-none sm:ml-auto">
        {/* Search Input */}
        <div className="relative flex-1 sm:w-64 md:w-80">
          <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search works"
            className="pl-8 sm:pl-10 w-full h-9 sm:h-10 text-sm"
            aria-label="Search works"
          />
        </div>
        
        {/* Filter Dialog */}
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-1 sm:gap-2 h-9 sm:h-10 px-2 sm:px-3 text-sm">
                    <Filter className="h-4 w-4" />
                    <span className="hidden sm:inline">Filter</span>
                    {activeFilterCount > 0 && (
                      <span className="ml-0 sm:ml-1 bg-[#4F46E5] text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Filter works</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <DialogContent className="sm:max-w-[600px] max-w-[95vw] p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4">
              <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                <FilterIcon className="w-5 h-5 text-indigo-600" />
                Filter Your Work
              </DialogTitle>
              <p className="text-sm text-slate-600 mt-1">
                Find exactly what you're looking for with these filters
              </p>
            </DialogHeader>

            <Tabs defaultValue="categories" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="categories" className="flex items-center gap-2">
                  <FilterIcon className="w-4 h-4" />
                  Categories
                </TabsTrigger>
                <TabsTrigger value="time" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Time Period
                </TabsTrigger>
                <TabsTrigger value="months" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Months
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="categories" className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-slate-700">Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(ASSIGNMENT_STATUS).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox 
                            id={value}
                            checked={tempFilters[value.toLowerCase() as keyof StudentDashboardFilters] as boolean}
                            onCheckedChange={() => handleFilterChange(value.toLowerCase())}
                          />
                          <Label htmlFor={value}>{STATUS_DISPLAY_NAMES[value]}</Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-slate-700">
                      Subjects
                      <span className="text-sm font-normal text-slate-500 ml-2">
                        for Grade {currentGrade}
                      </span>
                    </CardTitle>
                    <p className="text-sm text-slate-600">
                      Subjects available for your current grade level
                    </p>
                  </CardHeader>
                  <CardContent>
                    {availableSubjects && availableSubjects.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {availableSubjects.map((subject) => (
                          <div key={subject} className="flex items-center space-x-2">
                            <Checkbox 
                              id={subject}
                              checked={tempFilters[spacesToCamelCase(subject) as keyof StudentDashboardFilters] as boolean}
                              onCheckedChange={() => handleFilterChange(spacesToCamelCase(subject))}
                            />
                            <Label htmlFor={subject}>{subject}</Label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">No subjects available for Grade {currentGrade}</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="time" className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-slate-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Time Period
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {TIME_PERIODS.map((period) => (
                      <div 
                        key={period.value}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          tempFilters.timePeriod === period.value 
                            ? 'border-indigo-500 bg-indigo-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleTimePeriodChange(period.value)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-slate-800">{period.label}</div>
                            <div className="text-sm text-slate-600">{period.description}</div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            tempFilters.timePeriod === period.value 
                              ? 'border-indigo-500 bg-indigo-500' 
                              : 'border-gray-300'
                          }`}>
                            {tempFilters.timePeriod === period.value && (
                              <div className="w-full h-full bg-white rounded-full transform scale-50"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {tempFilters.timePeriod === 'custom' && (
                      <Card className="mt-4">
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium text-slate-700">From Date</Label>
                              <div className="mt-1">
                                <DatePicker
                                  value={tempFilters.dateRange?.from}
                                  onChange={(date) => handleCustomDateChange('from', date)}
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-slate-700">To Date</Label>
                              <div className="mt-1">
                                <DatePicker
                                  value={tempFilters.dateRange?.to}
                                  onChange={(date) => handleCustomDateChange('to', date)}
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="months" className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-slate-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Filter by Month
                    </CardTitle>
                    <p className="text-sm text-slate-600">
                      Select specific months to filter your work
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {FILTER_MONTHS.map((month) => (
                        <div 
                          key={month}
                          className={`p-3 rounded-lg border cursor-pointer transition-all text-center ${
                            tempFilters.months?.[month] 
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                          onClick={() => handleMonthFilterChange(month)}
                        >
                          <div className="font-medium text-sm">{month}</div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Quick select options */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Select current academic year months (July-May)
                            const academicMonths = ['July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May'];
                            setTempFilters(prev => ({
                              ...prev,
                              months: academicMonths.reduce((acc, month) => ({ ...acc, [month]: true }), prev.months || {})
                            }));
                          }}
                          className="text-xs"
                        >
                          Academic Year
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Select current quarter months
                            const now = new Date();
                            const currentMonth = now.getMonth();
                            const quarterStart = Math.floor(currentMonth / 3) * 3;
                            const quarterMonths = FILTER_MONTHS.slice(quarterStart, quarterStart + 3);
                            setTempFilters(prev => ({
                              ...prev,
                              months: quarterMonths.reduce((acc, month) => ({ ...acc, [month]: true }), prev.months || {})
                            }));
                          }}
                          className="text-xs"
                        >
                          Current Quarter
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Clear all month selections
                            setTempFilters(prev => ({
                              ...prev,
                              months: FILTER_MONTHS.reduce((acc, month) => ({ ...acc, [month]: false }), {})
                            }));
                          }}
                          className="text-xs"
                        >
                          Clear Months
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            {/* Filter Dialog Footer */}
            <DialogFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-6 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClearFilters}
                className="w-full sm:w-[140px] border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Clear All Filters
              </Button>
              
              <Button
                type="button"
                onClick={handleApplyFilters}
                className="w-full sm:w-[140px] bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Apply Filters
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Add Assignment Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={handleAddAssignment}
                variant="default"
                size="icon"
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg shadow-md h-9 w-9 sm:h-10 sm:w-10"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sr-only">Add</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create new work</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
} 