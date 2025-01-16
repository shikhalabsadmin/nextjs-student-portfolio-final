import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { MultiSelect } from '@/components/ui/multi-select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import type { Database, TeachingSubject } from '@/types/supabase';
import { useNavigate } from 'react-router-dom';
import { subjects, subjectDisplayMap } from '@/constants/subjects';
import { grades } from '@/constants/grades';
import { formatSubject, formatGrade } from '@/lib/utils';
import { Input } from '@/components/ui/input';

// Use Database types directly
type Profile = Database['public']['Tables']['profiles']['Row'];

// Define the types
interface TeachingProfile {
  selectedGrades: string[];  // ['4A', '4B', '4C', '5B', 'BBE']
  gradeSubjects: {
    [grade: string]: string[];  // { '4A': ['mathematics', 'science'], '4B': ['english'] }
  };
}

// Update the form schema
const formSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  selectedGrades: z.array(z.string()).min(1, 'Select at least one grade'),
  selectedSubjects: z.array(z.object({
    subject: z.string(),
    grade: z.string()
  })).min(1, 'Select at least one subject')
});

export const TeacherProfile = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const { data: profile, refetch } = useQuery({
    queryKey: ['teacher-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data as Profile;
    }
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: '',
      selectedGrades: [],
      selectedSubjects: []
    },
  });

  // Update form when profile data is loaded
  useEffect(() => {
    if (profile) {
      form.reset({
        full_name: profile.full_name || '',
        selectedGrades: profile.grade_levels?.map(String) || [],
        selectedSubjects: profile.teaching_subjects || []
      });
    }
  }, [profile, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: values.full_name,
          grade_levels: values.selectedGrades,
          teaching_subjects: values.selectedSubjects.map(s => ({
            subject: s.subject as string,
            grade: s.grade as string
          }))
        })
        .eq('id', user.id);

      if (error) throw error;

      await refetch();
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Teaching Profile</h1>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter your full name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="selectedGrades"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Grades You Teach</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={grades}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select grades..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="selectedSubjects"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subjects</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={subjects.map(subject => ({
                        label: subjectDisplayMap[subject.value] || subject.value,
                        value: subject.value
                      }))}
                      value={field.value?.map(s => s.subject) || []}
                      onChange={(selectedSubjects: string[]) => {
                        field.onChange(selectedSubjects.map(subject => ({
                          subject: subject,
                          grade: form.getValues('selectedGrades')[0] || ''
                        })));
                      }}
                      placeholder="Select subjects..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/app/assignments')}
              >
                Back to Assignments
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}; 