import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subjects, subjectDisplayMap } from '@/constants/subjects';
import { grades } from '@/constants/grades';
import { Search } from 'lucide-react';

export interface AssignmentFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedSubject: string;
  onSubjectChange: (value: string) => void;
  selectedGrade: string;
  onGradeChange: (value: string) => void;
  selectedMonth: string;
  onMonthChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  students: Array<{ id: string; full_name: string }>;
  selectedStudent: string;
  onStudentChange: (value: string) => void;
  availableGrades: string[];
  availableSubjects: string[];
}

export const AssignmentFilters = ({
  searchQuery,
  onSearchChange,
  selectedSubject,
  onSubjectChange,
  selectedGrade,
  onGradeChange,
  selectedMonth,
  onMonthChange,
  selectedStatus,
  onStatusChange,
  students,
  selectedStudent,
  onStudentChange,
  availableGrades,
  availableSubjects
}: AssignmentFiltersProps) => {
  // Generate months for the dropdown (last 6 months)
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return {
      value: `${year}-${month}`,
      label: new Date(`${year}-${month}-01`).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
    };
  });

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'SUBMITTED', label: 'Pending Review' },
    { value: 'NEEDS_REVISION', label: 'Needs Revision' },
    { value: 'VERIFIED', label: 'Verified' }
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search by title"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        {/* Student Filter */}
        <Select value={selectedStudent} onValueChange={onStudentChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Student" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Students</SelectItem>
            {students.map(student => (
              <SelectItem key={student.id} value={student.id}>
                {student.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={selectedStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(status => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Grade Filter */}
        <Select value={selectedGrade} onValueChange={onGradeChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Grade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {availableGrades.map(grade => (
              <SelectItem key={grade} value={grade}>
                Grade {grade}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Subject Filter */}
        <Select value={selectedSubject} onValueChange={onSubjectChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {availableSubjects.map(subject => (
              <SelectItem key={subject} value={subject}>
                {subjectDisplayMap[subject] || subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Month Filter */}
        <Select value={selectedMonth} onValueChange={onMonthChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {months.map(month => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}; 