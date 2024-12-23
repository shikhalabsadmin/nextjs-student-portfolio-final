import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { toast } from 'sonner';

interface PDFExportProps {
  assignmentId: string;
  title: string;
}

export const PDFExport = ({ assignmentId, title }: PDFExportProps) => {
  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignmentId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const { url } = await response.json();

      const { error } = await supabase
        .from('assignments')
        .update({ pdf_url: url })
        .eq('id', assignmentId);

      if (error) throw error;

      return url;
    },
    onSuccess: (url) => {
      toast.success('PDF generated successfully');
      window.open(url, '_blank');
    },
    onError: (error) => {
      toast.error('Failed to generate PDF');
      console.error('PDF generation error:', error);
    },
  });

  return (
    <Button
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className="flex items-center gap-2"
    >
      <FileDown className="h-4 w-4" />
      {mutation.isPending ? 'Generating PDF...' : 'Export as PDF'}
    </Button>
  );
};