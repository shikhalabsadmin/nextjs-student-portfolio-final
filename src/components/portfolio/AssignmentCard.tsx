import React from 'react';
import { BookOpen, Tag } from 'lucide-react';
import { Assignment, PortfolioTheme } from '@/types/portfolio';

interface AssignmentCardProps {
  assignment: Assignment;
  theme?: PortfolioTheme;
  onImageError: (assignmentId: string) => void;
  imageLoadError: boolean;
}

export const AssignmentCard = ({ 
  assignment, 
  theme, 
  onImageError,
  imageLoadError 
}: AssignmentCardProps) => {
  return (
    <div 
      className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow duration-200 animate-fade-in ${
        theme?.layout?.spacing === 'airy' ? 'p-6' : 'p-4'
      }`}
      style={{ fontFamily: theme?.typography?.bodyFont }}
    >
      {assignment.artifact_url && !imageLoadError && (
        <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-gray-100">
          <img 
            src={assignment.artifact_url}
            alt={assignment.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => onImageError(assignment.id)}
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2">
            {assignment.title}
          </h3>
          <span className="flex items-center gap-1 text-xs bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] px-2 py-1 rounded-full">
            <Tag className="h-3 w-3" />
            {assignment.artifact_type}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          {assignment.month}
        </div>
        <button 
          onClick={() => window.location.href = `/assignments/${assignment.id}`}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-[var(--theme-accent)] border border-[var(--theme-accent)] rounded-lg hover:bg-[var(--theme-accent)]/5 transition-colors duration-200"
        >
          <BookOpen className="h-4 w-4" />
          View Details
        </button>
      </div>
    </div>
  );
};