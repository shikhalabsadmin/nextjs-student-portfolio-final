import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { Textarea } from '@/components/ui/textarea';
import { SkillsSelect } from '@/components/teacher/SkillsSelect';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { MultiSelect, type Option } from '@/components/ui/multi-select/index';
import type { Database } from '@/types/supabase';
import { subjects, subjectDisplayMap } from '@/constants/subjects';
import { grades } from '@/constants/grades';
import { formatGrade } from '@/lib/utils';

console.log('MultiSelect import:', MultiSelect);

const formSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  description: z.string().min(1, 'Description is required'),
  subject: z.string().min(1, 'Subject is required'),
  gradeLevels: z.array(z.string()).min(1, 'Select at least one grade level'),
  dueDate: z.date().optional(),
});

type Assignment = Database['public']['Tables']['assignments']['Row'];

interface TeacherProfile {
  id: string;
  teaching_subjects: { subject: string; grade: string }[];
  grade_levels: string[];
}

export const AssignmentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teacherSubjects, setTeacherSubjects] = useState<string[]>([]);
  const [teacherGrades, setTeacherGrades] = useState<string[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: '',
      description: '',
      subject: '',
      gradeLevels: [],
      dueDate: undefined,
    },
  });

  // Fetch existing assignment data if editing
  useEffect(() => {
    const fetchAssignment = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('assignments')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          form.reset({
            topic: data.title,
            description: data.description || '',
            subject: data.subject,
            gradeLevels: [data.grade],
            dueDate: data.due_date ? new Date(data.due_date) : undefined,
          });
        }
      } catch (error) {
        console.error('Error fetching assignment:', error);
        toast({
          title: 'Error',
          description: 'Failed to load assignment data.',
          variant: 'destructive',
        });
      }
    };

    fetchAssignment();
  }, [id, form]);

  // Fetch teacher profile data
  useEffect(() => {
    const fetchTeacherData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, teaching_subjects, grade_levels')
        .eq('id', user.id)
        .single() as unknown as { 
          data: { 
            teaching_subjects: { subject: string; grade: string }[];
            grade_levels: string[];
          } | null;
          error: null;
        };

      // Log both the data and error to see what's happening
      console.log('Query result:', { data, error });

      if (error) {
        console.error('Error:', error);
        return;
      }

      // Ensure teaching_subjects is parsed from JSONB
      const teachingSubjects = data?.teaching_subjects || [];
      const teachingGrades = data?.grade_levels || [];

      // Extract unique subjects
      const uniqueSubjects = [...new Set(
        teachingSubjects.map((ts: { subject: string }) => ts.subject)
      )];

      setTeacherSubjects(uniqueSubjects);
      setTeacherGrades(teachingGrades);
    };

    fetchTeacherData();
  }, []);

  // Create options arrays based on teacher data or defaults
  const subjectOptions = teacherSubjects.length > 0
    ? teacherSubjects.map(subject => ({
        label: subjectDisplayMap[subject] || subject,
        value: subject
      }))
    : subjects; // Fall back to default subjects array

  const gradeOptions: Option[] = teacherGrades.length > 0
    ? teacherGrades.map(grade => ({
        label: formatGrade(grade),
        value: grade
      }))
    : grades; // Fall back to default grades array

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const assignmentData = {
        student_id: user.id,
        title: values.topic,
        artifact_type: 'assignment',
        subject: values.subject,
        month: new Date().toISOString().split('T')[0],
        status: 'DRAFT',
        is_team_work: false,
        is_original_work: true,
        teacher_id: user.id,
        description: values.description || null,
        grade: values.gradeLevels[0] as string,
        due_date: values.dueDate?.toISOString() || null,
      };

      const { error } = id
        ? await supabase
            .from('assignments')
            .update(assignmentData)
            .eq('id', id)
        : await supabase
            .from('assignments')
            .insert(assignmentData);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Assignment saved successfully.',
      });

      navigate('/app/assignments');
    } catch (error) {
      console.error('Error saving assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to save assignment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Create New Assignment</h1>
          <Button variant="outline" onClick={() => navigate('/app/assignments')}>
            Back to Assignments
          </Button>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter assignment topic" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Describe what students need to do"
                      className="h-32"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                    >
                      <option value="">Select a subject</option>
                      {subjectOptions.map(subject => (
                        <option key={subject.value} value={subject.value}>
                          {subject.label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  {teacherSubjects.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Using default subjects. Set your teaching subjects in profile to customize.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gradeLevels"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade Levels</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={gradeOptions}
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder="Select grade levels"
                    />
                  </FormControl>
                  {teacherGrades.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Using default grades. Set your teaching grades in profile to customize.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date (Optional)</FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/app/assignments')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Assignment'}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}; 