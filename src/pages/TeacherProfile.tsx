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

// Define the types for grade-specific subjects
interface GradeSubjects {
  [grade: string]: string[];  // Maps grade to array of subjects
}

// Update the form schema
const formSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  selectedGrades: z.array(z.string()).min(1, 'Select at least one grade'),
  gradeSubjects: z.record(z.array(z.string())).optional()
});

export const TeacherProfile = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormModified, setIsFormModified] = useState(false);
  const [initialValues, setInitialValues] = useState<z.infer<typeof formSchema> | null>(null);
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
      gradeSubjects: {}
    },
  });

  // Update form and initial values when profile data is loaded
  useEffect(() => {
    if (profile) {
      // Convert teaching_subjects array to gradeSubjects object
      const gradeSubjects: GradeSubjects = {};
      profile.teaching_subjects?.forEach(ts => {
        if (!gradeSubjects[ts.grade]) {
          gradeSubjects[ts.grade] = [];
        }
        gradeSubjects[ts.grade].push(ts.subject);
      });

      const values = {
        full_name: profile.full_name || '',
        selectedGrades: profile.grade_levels?.map(String) || [],
        gradeSubjects
      };

      form.reset(values);
      setInitialValues(values);
      setIsFormModified(false); // Reset modification state when profile is loaded
    }
  }, [profile, form]);

  // Watch for form changes and compare with initial values
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (!initialValues) return;

      const hasChanged = 
        value.full_name !== initialValues.full_name ||
        JSON.stringify(value.selectedGrades) !== JSON.stringify(initialValues.selectedGrades) ||
        JSON.stringify(value.gradeSubjects) !== JSON.stringify(initialValues.gradeSubjects);

      setIsFormModified(hasChanged);
    });
    return () => subscription.unsubscribe();
  }, [form, initialValues]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isSubmitting) return; // Prevent double submission
    
    try {
      setIsSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Convert gradeSubjects object to teaching_subjects array
      const teaching_subjects = Object.entries(values.gradeSubjects || {}).flatMap(
        ([grade, subjects]) => subjects.map(subject => ({
          subject,
          grade
        }))
      );

      const updateData = {
        full_name: values.full_name,
        grade_levels: values.selectedGrades,
        teaching_subjects
      };

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Only refetch if the update was successful
      await refetch();
      setIsFormModified(false); // Reset modification state after successful save
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });

      // Navigate back to assignments after successful save
      navigate('/app/assignments');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Watch selectedGrades to manage gradeSubjects
  const selectedGrades = form.watch('selectedGrades');
  const gradeSubjects = form.watch('gradeSubjects') || {};

  // Clean up gradeSubjects when grades are removed
  useEffect(() => {
    const currentGradeSubjects = { ...gradeSubjects };
    Object.keys(currentGradeSubjects).forEach(grade => {
      if (!selectedGrades.includes(grade)) {
        delete currentGradeSubjects[grade];
      }
    });
    form.setValue('gradeSubjects', currentGradeSubjects);
  }, [selectedGrades, form]);

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

            {selectedGrades.map(grade => (
              <FormField
                key={grade}
                control={form.control}
                name={`gradeSubjects.${grade}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subjects for Grade {grade}</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={subjects.map(subject => ({
                          label: subjectDisplayMap[subject.value] || subject.value,
                          value: subject.value
                        }))}
                        value={field.value || []}
                        onChange={field.onChange}
                        placeholder={`Select subjects for Grade ${grade}...`}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

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
                disabled={isSubmitting || !isFormModified}
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