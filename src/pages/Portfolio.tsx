import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { z } from "zod";
import { PortfolioHeader } from '@/components/portfolio/PortfolioHeader';
import { PortfolioFilters } from '@/components/portfolio/PortfolioFilters';
import { AssignmentCard } from '@/components/portfolio/AssignmentCard';
import type { Assignment, PortfolioTheme } from '@/types/portfolio';

// Validation schema for search and filters
const filterSchema = z.object({
  searchTerm: z.string(),
  subject: z.string(),
});

const Portfolio = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [imageLoadError, setImageLoadError] = useState<Record<string, boolean>>({});

  // Fetch portfolio theme
  const { data: themeData } = useQuery({
    queryKey: ['portfolio-theme'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portfolio_themes')
        .select('*')
        .single();

      if (error) {
        toast.error('Failed to load theme');
        throw error;
      }

      // Type assertion to ensure the data matches our PortfolioTheme interface
      return data as unknown as PortfolioTheme;
    },
  });

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to load assignments');
        throw error;
      }

      return data as Assignment[];
    },
  });

  // Validate and filter assignments
  const filteredAssignments = assignments?.filter(assignment => {
    try {
      const validatedFilters = filterSchema.parse({
        searchTerm,
        subject: selectedSubject,
      });

      const matchesSearch = assignment.title.toLowerCase().includes(validatedFilters.searchTerm.toLowerCase()) ||
                           assignment.subject.toLowerCase().includes(validatedFilters.searchTerm.toLowerCase());
      const matchesSubject = !validatedFilters.subject || assignment.subject === validatedFilters.subject;
      return matchesSearch && matchesSubject;
    } catch (error) {
      console.error('Filter validation error:', error);
      return false;
    }
  });

  const subjects = Array.from(new Set(assignments?.map(a => a.subject) || []));

  const handleImageError = (assignmentId: string) => {
    setImageLoadError(prev => ({ ...prev, [assignmentId]: true }));
  };

  // Apply theme styles
  const themeStyles = themeData ? {
    backgroundColor: themeData.colors.background,
    color: themeData.colors.text,
    '--theme-primary': themeData.colors.primary,
    '--theme-secondary': themeData.colors.secondary,
    '--theme-accent': themeData.colors.accent,
  } as React.CSSProperties : {};

  return (
    <div className="min-h-screen" style={themeStyles}>
      <PortfolioHeader theme={themeData} />
      
      <PortfolioFilters 
        searchTerm={searchTerm}
        selectedSubject={selectedSubject}
        subjects={subjects}
        onSearchChange={setSearchTerm}
        onSubjectChange={setSelectedSubject}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--theme-accent)]"></div>
          </div>
        ) : filteredAssignments?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No assignments found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssignments?.map(assignment => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                theme={themeData}
                onImageError={handleImageError}
                imageLoadError={imageLoadError[assignment.id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolio;