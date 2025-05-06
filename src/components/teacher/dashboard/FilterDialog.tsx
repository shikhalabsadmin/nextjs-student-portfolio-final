import { useState, useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import { FilterButton } from "@/components/ui/filter-button";
import { CheckboxGroup } from "@/components/ui/checkbox-group";
import { TeacherDashboardFilters, TeachingSubject } from "@/types/teacher-dashboard";
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

  // Get filtered subjects based on selected grade
  const filteredSubjects = selectedGrade && teachingSubjects
    ? getSubjectsForGrade(selectedGrade, teachingSubjects)
    : [];

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
        <FilterButton onClick={() => {}} count={activeFilterCount} />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-w-[90vw] p-4 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg text-slate-800">Filter works</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4 overflow-y-auto max-h-[60vh] sm:max-h-[70vh]">
          <CheckboxGroup
            title="Grade"
            items={allGrades}
            selectedItems={tempFilters.grades}
            onItemChange={handleGradeFilterChange}
          />

          {filteredSubjects.length > 0 && (
            <CheckboxGroup
              title="Subject"
              subtitle={selectedGrade ? `for ${selectedGrade}` : undefined}
              items={filteredSubjects}
              selectedItems={tempFilters.subjects}
              onItemChange={handleSubjectFilterChange}
            />
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0 mt-4">
          <Button
            variant="outline"
            onClick={handleClearFilters}
            className="w-full sm:w-[120px] border-slate-300 text-slate-900"
          >
            Clear All
          </Button>
          <Button 
            onClick={handleApplyFilters} 
            className="w-full sm:w-[120px] bg-slate-900 hover:bg-slate-700 text-white"
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