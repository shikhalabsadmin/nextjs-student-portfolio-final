import React from 'react';
import { Search, Filter } from 'lucide-react';
import { formatSubject } from '@/lib/utils';

interface PortfolioFiltersProps {
  searchTerm: string;
  selectedSubject: string;
  subjects: string[];
  onSearchChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
}

export const PortfolioFilters = ({
  searchTerm,
  selectedSubject,
  subjects,
  onSearchChange,
  onSubjectChange,
}: PortfolioFiltersProps) => {
  return (
    <div className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search assignments..." 
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={selectedSubject}
                onChange={(e) => onSubjectChange(e.target.value)}
                className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent"
              >
                <option value="">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{formatSubject(subject)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};