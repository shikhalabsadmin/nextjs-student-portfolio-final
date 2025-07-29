import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { DbClient } from '@/types/supabase';
import { Assignment } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RichTextEditor } from "@/components/RichTextEditor";

const editAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().optional(),
  grade: z.string().min(1, 'Grade is required'),
});

type EditAssignmentFormData = z.infer<typeof editAssignmentSchema>;

interface Props {
  assignment: Assignment;
  isOpen?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditAssignmentModal({ 
  assignment,
  isOpen = true, 
  onClose, 
  onSuccess 
}: Props) {
  const { toast } = useToast();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditAssignmentFormData>({
    resolver: zodResolver(editAssignmentSchema),
    defaultValues: {
      title: assignment.title,
      subject: assignment.subject,
      description: assignment.description || '',
      grade: assignment.grade,
    },
  });

  const onSubmit = async (data: EditAssignmentFormData) => {
    try {
      // Update the assignment
      const { error: assignmentError } = await (supabase as DbClient)
        .from('assignments')
        .update({
          title: data.title,
          description: data.description,
          subject: data.subject,
          grade: data.grade,
        })
        .eq('id', assignment.id);

      if (assignmentError) throw assignmentError;

      toast({
        title: 'Success',
        description: 'Assignment updated successfully',
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to update assignment. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Assignment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label>Title</Label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Enter assignment title"
                  className="mt-1"
                />
              )}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label>Subject</Label>
            <Controller
              name="subject"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MATH">Mathematics</SelectItem>
                    <SelectItem value="SCIENCE">Science</SelectItem>
                    <SelectItem value="ENGLISH">English</SelectItem>
                    <SelectItem value="SOCIAL_STUDIES">Social Studies</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.subject && (
              <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
            )}
          </div>

          <div>
            <Label>Grade Level</Label>
            <Controller
              name="grade"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">Grade 6</SelectItem>
                    <SelectItem value="7">Grade 7</SelectItem>
                    <SelectItem value="8">Grade 8</SelectItem>
                    <SelectItem value="9">Grade 9</SelectItem>
                    <SelectItem value="10">Grade 10</SelectItem>
                    <SelectItem value="11">Grade 11</SelectItem>
                    <SelectItem value="12">Grade 12</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.grade && (
              <p className="mt-1 text-sm text-red-600">{errors.grade.message}</p>
            )}
          </div>

          <div>
            <Label>Description</Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Describe the assignment"
                />
              )}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 