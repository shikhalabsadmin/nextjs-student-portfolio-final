import { useState, useEffect, memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { FilterButton } from "@/components/ui/filter-button";
import { CheckboxGroup } from "@/components/ui/checkbox-group";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeacherDashboardFilters, TeachingSubject, TimePeriod, DateRange } from "@/types/teacher-dashboard";
import { Calendar, Clock, Filter as FilterIcon } from "lucide-react";
import { FILTER_MONTHS } from "@/constants/months-filter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

interface FilterDialogProps {
  activeFilterCount: number;
  selectedFilters: TeacherDashboardFilters;
  onFilterChange: (filters: TeacherDashboardFilters) => void;
  allGrades: string[];
  teachingSubjects?: TeachingSubject[];
  hasFilters: boolean;
}

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

export const FilterDialog = memo(({
  activeFilterCount,
  selectedFilters,
  onFilterChange,
  allGrades,
  teachingSubjects,
  hasFilters,
}: FilterDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] =
    useState<TeacherDashboardFilters>(selectedFilters);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);

  // Get all subjects the teacher teaches (more intelligent approach)
  const allTeacherSubjects = useMemo(() => {
    if (!teachingSubjects) return [];
    
    // Extract all unique subjects this teacher teaches
    return Array.from(
      new Set(
        teachingSubjects
          .map(item => item?.subject || "")
          .filter(Boolean)
      )
    ).sort();
  }, [teachingSubjects]);

  // Get filtered subjects based on selected grade (fallback to all subjects if no grade selected)
  const filteredSubjects = selectedGrade && teachingSubjects
    ? getSubjectsForGrade(selectedGrade, teachingSubjects)
    : allTeacherSubjects;

  // Reset selections when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedGrade(null);
    }
  }, [isOpen]);

  const handleGradeFilterChange = (grade: string) => {
    const gradeKey = grade.toLowerCase().replace(/\s+/g, "");
    const isSelected = !tempFilters.grades[gradeKey];

    // Update selected grade for filtering subjects
    if (isSelected) {
      setSelectedGrade(grade);
    } else if (selectedGrade === grade) {
      setSelectedGrade(null);
    }

    // Update grade filters
    setTempFilters((prev) => ({
      ...prev,
      grades: {
        ...prev.grades,
        [gradeKey]: isSelected,
      },
    }));
  };

  const handleSubjectFilterChange = (subject: string) => {
    const subjectKey = subject.toLowerCase().replace(/\s+/g, "");
    setTempFilters((prev) => ({
      ...prev,
      subjects: {
        ...prev.subjects,
        [subjectKey]: !prev.subjects[subjectKey],
      },
    }));
  };

  const handleTimePeriodChange = (period: TimePeriod) => {
    const dateRange = getDateRangeForPeriod(period);
    setTempFilters((prev) => ({
      ...prev,
      timePeriod: period,
      dateRange: period !== 'custom' ? dateRange : prev.dateRange,
    }));
  };

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

  const handleApplyFilters = () => {
    onFilterChange(tempFilters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters: TeacherDashboardFilters = {
      status: Object.keys(selectedFilters.status).reduce(
        (acc, key) => ({ ...acc, [key]: false }),
        {} as Record<string, boolean>
      ),
      subjects: Object.keys(selectedFilters.subjects).reduce(
        (acc, key) => ({ ...acc, [key]: false }),
        {} as Record<string, boolean>
      ),
      grades: Object.keys(selectedFilters.grades).reduce(
        (acc, key) => ({ ...acc, [key]: false }),
        {} as Record<string, boolean>
      ),
      dateRange: undefined,
      timePeriod: undefined,
      months: FILTER_MONTHS.reduce(
        (acc, month) => ({ ...acc, [month]: false }),
        {} as Record<string, boolean>
      ),
    };
    setTempFilters(clearedFilters);
    onFilterChange(clearedFilters);
    setIsOpen(false);
    setSelectedGrade(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setTempFilters(selectedFilters);
    }
  };

  if (!hasFilters) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <FilterButton 
          onClick={() => {}} 
          count={activeFilterCount} 
          className="h-9 sm:h-10 px-2.5 sm:px-3 text-xs sm:text-sm" 
        />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-w-[95vw] p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <FilterIcon className="w-5 h-5 text-indigo-600" />
            Filter Student Works
          </DialogTitle>
          <p className="text-sm text-slate-600 mt-1">
            Refine your view to find exactly what you're looking for
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
                <CardTitle className="text-base text-slate-700">Grade Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <CheckboxGroup
                  title=""
                  items={allGrades}
                  selectedItems={tempFilters.grades}
                  onItemChange={handleGradeFilterChange}
                />
              </CardContent>
            </Card>

            {filteredSubjects.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-slate-700">
                    Subjects
                    {selectedGrade ? (
                      <span className="text-sm font-normal text-slate-500 ml-2">
                        for {selectedGrade}
                      </span>
                    ) : (
                      <span className="text-sm font-normal text-slate-500 ml-2">
                        you teach
                      </span>
                    )}
                  </CardTitle>
                  {!selectedGrade && (
                    <p className="text-sm text-slate-600">
                      Showing all subjects you teach. Select a grade above to filter by specific grade.
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <CheckboxGroup
                    title=""
                    items={filteredSubjects}
                    selectedItems={tempFilters.subjects}
                    onItemChange={handleSubjectFilterChange}
                  />
                </CardContent>
              </Card>
            )}
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
                  Select specific months to filter work submissions
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

        <DialogFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClearFilters}
            className="w-full sm:w-[140px] border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Clear All Filters
          </Button>
          <Button 
            onClick={handleApplyFilters} 
            className="w-full sm:w-[140px] bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

// Helper function to get subjects for a specific grade
function getSubjectsForGrade(grade: string, teachingSubjects: TeachingSubject[]): string[] {
  if (!teachingSubjects) return [];
  
  return teachingSubjects
    .filter(subject => subject.grade === grade)
    .map(subject => subject.subject)
    .filter((subject, index, self) => self.indexOf(subject) === index); // Remove duplicates
}

FilterDialog.displayName = 'FilterDialog'; 