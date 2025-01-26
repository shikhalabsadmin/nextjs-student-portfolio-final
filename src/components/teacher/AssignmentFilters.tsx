import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { subjects, subjectDisplayMap } from '@/constants/subjects';
import { grades } from '@/constants/grades';
import { Search } from 'lucide-react';

interface AssignmentFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedSubject: string;
  onSubjectChange: (value: string) => void;
  selectedGrade: string;
  onGradeChange: (value: string) => void;
  selectedMonth: string;
  onMonthChange: (value: string) => void;
}

export const AssignmentFilters = ({
  searchQuery,
  onSearchChange,
  selectedSubject,
  onSubjectChange,
  selectedGrade,
  onGradeChange,
  selectedMonth,
  onMonthChange
}: AssignmentFiltersProps) => {
  // Generate months for the dropdown (last 6 months)
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search by title or student name"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Subject Filter */}
        <Select
          value={selectedSubject}
          onValueChange={onSubjectChange}
        >
          <option value="">All Subjects</option>
          {subjects.map(subject => (
            <option key={subject.value} value={subject.value}>
              {subjectDisplayMap[subject.value] || subject.value}
            </option>
          ))}
        </Select>

        {/* Grade Filter */}
        <Select
          value={selectedGrade}
          onValueChange={onGradeChange}
        >
          <option value="">All Grades</option>
          {grades.map(grade => (
            <option key={grade.value} value={grade.value}>
              {grade.label}
            </option>
          ))}
        </Select>

        {/* Month Filter */}
        <Select
          value={selectedMonth}
          onValueChange={onMonthChange}
        >
          <option value="">All Months</option>
          {months.map(month => (
            <option key={month} value={month}>
              {new Date(month + '-01').toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}; 