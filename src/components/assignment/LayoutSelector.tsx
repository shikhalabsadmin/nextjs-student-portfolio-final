import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Layout, Grid, Columns, List } from 'lucide-react';
import { toast } from 'sonner';

interface LayoutSelectorProps {
  assignmentId: string;
  currentLayout: string;
  onLayoutChange: (layout: string) => void;
}

export const LayoutSelector = ({ assignmentId, currentLayout, onLayoutChange }: LayoutSelectorProps) => {
  const layouts = [
    { id: 'classic', icon: Layout, label: 'Classic' },
    { id: 'showcase', icon: Grid, label: 'Showcase' },
    { id: 'split', icon: Columns, label: 'Split View' },
    { id: 'timeline', icon: List, label: 'Timeline' },
  ];

  const mutation = useMutation({
    mutationFn: async (layout: string) => {
      const { error } = await supabase
        .from('assignments')
        .update({
          display_layout: { type: layout }
        })
        .eq('id', assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Layout updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update layout');
      console.error('Layout update error:', error);
    },
  });

  const handleLayoutChange = (layout: string) => {
    onLayoutChange(layout);
    mutation.mutate(layout);
  };

  return (
    <div className="flex gap-2 p-4 bg-white border-b">
      {layouts.map(({ id, icon: Icon, label }) => (
        <Button
          key={id}
          variant={currentLayout === id ? 'default' : 'outline'}
          onClick={() => handleLayoutChange(id)}
          className="flex items-center gap-2"
        >
          <Icon className="h-4 w-4" />
          {label}
        </Button>
      ))}
    </div>
  );
};