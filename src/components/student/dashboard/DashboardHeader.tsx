import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { StudentDashboardFilters } from '@/types/student-dashboard';
import { ASSIGNMENT_STATUS, STATUS_DISPLAY_NAMES } from '@/constants/assignment-status';
import { Subject, GradeLevel } from '@/constants/grade-subjects';

interface DashboardHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedFilters: StudentDashboardFilters;
  onFilterChange: (filters: StudentDashboardFilters) => void;
  availableSubjects: Subject[];
  currentGrade: GradeLevel;
}

export function DashboardHeader({
  searchQuery,
  onSearchChange,
  selectedFilters,
  onFilterChange,
  availableSubjects,
  currentGrade
}: DashboardHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<StudentDashboardFilters>(selectedFilters);

  const handleFilterChange = (filterKey: string) => {
    setTempFilters(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey as keyof StudentDashboardFilters]
    }));
  };

  const handleApplyFilters = () => {
    onFilterChange(tempFilters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters: StudentDashboardFilters = Object.keys(selectedFilters).reduce(
      (acc, key) => ({ ...acc, [key]: false }),
      {} as StudentDashboardFilters
    );
    setTempFilters(clearedFilters);
    onFilterChange(clearedFilters);
    setIsOpen(false);
  };

  // Reset temp filters when dialog opens
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setTempFilters(selectedFilters);
    }
  };

  return (
    <div className="flex flex-col gap-5 lg:gap-0 lg:flex-row lg:justify-between lg:items-center">
      <h2 className="text-xl font-semibold text-gray-900">My Artefacts</h2>
      
      <div className="flex flex-col lg:flex-row lg:items-center gap-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by artefacts name, Subject"
            className="pl-10 w-full lg:w-80"
          />
        </div>
        
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Filter Artefacts</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="space-y-4">
                <h3 className="font-medium">Status</h3>
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

              <div className="space-y-4">
                <h3 className="font-medium">Subject</h3>
                <div className="grid grid-cols-2 gap-4">
                  {availableSubjects.map((subject) => (
                    <div key={subject} className="flex items-center space-x-2">
                      <Checkbox 
                        id={subject}
                        checked={tempFilters[subject.toLowerCase().replace(/\s+/g, '') as keyof StudentDashboardFilters]}
                        onCheckedChange={() => handleFilterChange(subject.toLowerCase().replace(/\s+/g, ''))}
                      />
                      <Label htmlFor={subject}>{subject}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="flex flex-row justify-between lg:justify-between items-center">
              <Button
                type="button"
                variant="outline"
                onClick={handleClearFilters}
                className="w-[120px]"
              >
                Clear All
              </Button>
              <Button
                type="button"
                onClick={handleApplyFilters}
                className="w-[120px]"
              >
                Apply Filters
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 