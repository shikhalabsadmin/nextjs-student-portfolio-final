import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

export const QuestionImport = () => {
  const [file, setFile] = useState<File | null>(null);

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const response = await fetch('/api/import-questions', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to import questions');
      }

      const { importId } = await response.json();

      const { error } = await supabase
        .from('question_imports')
        .insert({
          teacher_id: user.id,
          file_name: file?.name || 'unknown',
        });

      if (error) throw error;

      return importId;
    },
    onSuccess: () => {
      toast.success('Questions imported successfully');
      setFile(null);
    },
    onError: (error) => {
      toast.error('Failed to import questions');
      console.error('Question import error:', error);
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleImport = () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    mutation.mutate(formData);
  };

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center gap-4">
        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={handleFileChange}
          className="hidden"
          id="question-import"
        />
        <label
          htmlFor="question-import"
          className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50"
        >
          <Upload className="h-4 w-4" />
          {file ? file.name : 'Choose file'}
        </label>
        <Button
          onClick={handleImport}
          disabled={!file || mutation.isPending}
        >
          {mutation.isPending ? 'Importing...' : 'Import Questions'}
        </Button>
      </div>
    </div>
  );
};