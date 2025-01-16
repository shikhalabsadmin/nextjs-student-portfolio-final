import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { DbClient } from '@/types/supabase';
import { TemplateData } from '@/types/assignments';
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

const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().optional(),
  grade: z.string().min(1, 'Grade is required'),
  template_data: z.any().optional(),
});

type CreateAssignmentFormData = z.infer<typeof createAssignmentSchema>;

interface Props {
  teacherId: string;
  onSuccess: () => void;
}

export default function CreateAssignmentForm({ teacherId, onSuccess }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateAssignmentFormData>({
    resolver: zodResolver(createAssignmentSchema),
  });

  const onSubmit = async (data: CreateAssignmentFormData) => {
    setIsSubmitting(true);
    try {
      // Create the assignment
      const { error: assignmentError } = await (supabase as DbClient)
        .from('assignments')
        .insert({
          title: data.title,
          description: data.description,
          subject: data.subject,
          grade: data.grade,
          teacher_id: teacherId,
          type: 'TEACHER_CREATED',
          status: 'PUBLISHED',
          template_data: data.template_data,
          is_parent: true,
        });

      if (assignmentError) throw assignmentError;

      toast({
        title: 'Success',
        description: 'Assignment created successfully',
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to create assignment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
            <Textarea
              {...field}
              placeholder="Describe the assignment"
              className="mt-1"
              rows={4}
            />
          )}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Assignment'}
        </Button>
      </div>
    </form>
  );
} 