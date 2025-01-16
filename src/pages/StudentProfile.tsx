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
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { grades } from '@/constants/grades';
import { formatGrade } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from '@/types/supabase';
import { useAuthState } from '@/hooks/useAuthState';

interface Profile {
  id: string;
  full_name: string;
  grade: string | null;
  role: string;
}

// Define the form schema
const formSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  grade: z.string().min(1, 'Grade is required'),
});

export const StudentProfile = () => {
  console.log('[StudentProfile] Component mounted');
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthState();

  console.log('[StudentProfile] Initial render with user:', { 
    userId: user?.id,
    userMetadata: user?.user_metadata,
    hasUser: !!user 
  });

  const { data: profile, refetch } = useQuery({
    queryKey: ['student-profile'],
    enabled: !!user,
    queryFn: async () => {
      if (!user) {
        console.log('[StudentProfile] No user found, skipping profile fetch');
        return null;
      }

      console.log('[StudentProfile] Starting profile fetch for user:', user.id);

      // Get user metadata first
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      console.log('[StudentProfile] Auth state:', { 
        currentUserId: currentUser?.id,
        metadata: currentUser?.user_metadata,
        error: userError,
        matchesContextUser: currentUser?.id === user.id
      });

      console.log('[StudentProfile] Fetching profile data');
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, grade, role')
        .eq('id', user.id)
        .single();

      console.log('[StudentProfile] Profile fetch result:', { 
        success: !!data,
        error,
        errorCode: error?.code,
        errorMessage: error?.message,
        data: data
      });
      
      if (error) {
        console.error('[StudentProfile] Profile fetch error:', {
          error,
          context: {
            userId: user.id,
            currentUserId: currentUser?.id
          }
        });
        throw error;
      }
      
      // If profile has no grade but user metadata does, update the profile
      if (!data.grade && currentUser?.user_metadata?.grade) {
        console.log('[StudentProfile] Updating profile with grade from metadata:', {
          currentGrade: data.grade,
          metadataGrade: currentUser.user_metadata.grade
        });
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ grade: currentUser.user_metadata.grade })
          .eq('id', user.id);

        if (updateError) {
          console.error('[StudentProfile] Grade update error:', {
            error: updateError,
            context: {
              userId: user.id,
              attemptedGrade: currentUser.user_metadata.grade
            }
          });
          throw updateError;
        }

        data.grade = currentUser.user_metadata.grade;
      }

      console.log('[StudentProfile] Final profile data:', data);
      return data as Profile;
    }
  });

  useEffect(() => {
    console.log('[StudentProfile] Profile data updated:', profile);
  }, [profile]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      grade: profile?.grade || '',
    },
  });

  // Update form when profile data is loaded
  useEffect(() => {
    if (profile) {
      console.log('[StudentProfile] Setting form data:', {
        fullName: profile.full_name,
        grade: profile.grade
      });
      form.reset({
        full_name: profile.full_name || '',
        grade: profile.grade || '',
      });
    }
  }, [profile, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      if (!user) throw new Error('Not authenticated');

      console.log('[StudentProfile] Submitting profile update:', {
        values,
        userId: user.id
      });

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: values.full_name,
          grade: values.grade,
        })
        .eq('id', user.id);

      if (error) {
        console.error('[StudentProfile] Profile update error:', {
          error,
          context: {
            userId: user.id,
            values
          }
        });
        throw error;
      }

      console.log('[StudentProfile] Profile updated successfully');
      await refetch();
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error) {
      console.error('[StudentProfile] Profile update failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Student Profile</h1>
        
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
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your grade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {grades.map((grade) => (
                        <SelectItem key={grade.value} value={grade.value}>
                          {grade.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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