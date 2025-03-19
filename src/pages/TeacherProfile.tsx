import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { MultiSelect } from "@/components/ui/multi-select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useBeforeUnload } from "react-router-dom";
import { Input } from "@/components/ui/input";
import {
  GRADE_LEVELS,
  GRADE_SUBJECTS,
  type GradeLevel,
} from "@/constants/grade-subjects";
import { EnhancedUser } from "@/hooks/useAuthState";
import type { TeachingSubject } from "@/types/supabase";
import { ROUTES } from "@/config/routes";
import { createDebugService } from "@/lib/utils/debug.service";

// Create debug instance for TeacherProfile
const debug = createDebugService("TeacherProfile");

// Types
interface GradeSubjects {
  [grade: string]: string[];
}

interface Option {
  label: string;
  value: string;
}

// Form schema with stricter validation
const formSchema = z
  .object({
    full_name: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must not exceed 100 characters"),
    selectedGrades: z
      .array(z.enum([...Object.values(GRADE_LEVELS)] as [string, ...string[]]))
      .min(1, "Select at least one grade"),
    gradeSubjects: z
      .record(
        z.string(),
        z.array(z.string()).min(1, "Select at least one subject per grade")
      )
      .optional(),
  })
  .refine(
    (data) => {
      if (!data.selectedGrades?.length) return true;
      return data.selectedGrades.every(
        (grade) => data.gradeSubjects?.[grade]?.length > 0
      );
    },
    {
      message: "Each selected grade must have at least one subject",
      path: ["gradeSubjects"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

// Memoized grade options
const getGradeOptions = (): Option[] =>
  Object.values(GRADE_LEVELS).map((grade) => ({
    label: `Grade ${grade ?? "Unknown"}`,
    value: grade ?? "",
  }));

// Helper function to extract grade subjects from user data
const extractGradeSubjects = (teachingSubjects: TeachingSubject[] = []): GradeSubjects => {
  const gradeSubjects: GradeSubjects = {};
  
  teachingSubjects.forEach((ts) => {
    if (!ts?.grade) return;
    
    gradeSubjects[ts.grade] = gradeSubjects[ts.grade] || [];
    if (ts?.subject) gradeSubjects[ts.grade].push(ts.subject);
  });
  
  return gradeSubjects;
};

export const TeacherProfile = ({ user }: { user: EnhancedUser | null }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      selectedGrades: [],
      gradeSubjects: {},
    },
    mode: "onChange",
  });
  
  const isDirty = form.formState.isDirty;
  const isValid = form.formState.isValid;
  
  // Warn user before leaving with unsaved changes
  useBeforeUnload(
    useCallback(
      (event) => {
        if (isDirty) {
          event.preventDefault();
          return "You have unsaved changes. Are you sure you want to leave?";
        }
      },
      [isDirty]
    )
  );

  // Initialize form with user data
  useEffect(() => {
    if (!user) return;
    
    debug.log("Initializing form with user data", user);
    
    const gradeSubjects = extractGradeSubjects(user?.teaching_subjects as TeachingSubject[]);
    debug.log("Processed grade subjects", gradeSubjects);

    form.reset({
      full_name: user?.full_name as string ?? "",
      selectedGrades: (user?.grade_levels as string[])?.map(String) ?? [],
      gradeSubjects: Object.keys(gradeSubjects).length > 0 ? gradeSubjects : {},
    });
  }, [user]);

  // Clean up subjects when grades change
  useEffect(() => {
    const selectedGrades = form.watch("selectedGrades");
    debug.log("Selected grades changed", selectedGrades);
    
    // Only run this effect when selectedGrades actually changes
    if (!selectedGrades || selectedGrades.length === 0) return;
    
    const currentGradeSubjects = form.getValues("gradeSubjects") ?? {};
    
    // Filter out subjects for grades that are no longer selected
    const cleanedGradeSubjects = Object.fromEntries(
      Object.entries(currentGradeSubjects).filter(([grade]) =>
        selectedGrades.includes(grade)
      )
    );
    
    debug.log("Cleaned grade subjects", cleanedGradeSubjects);
    
    // Only update if there was a change
    if (JSON.stringify(currentGradeSubjects) !== JSON.stringify(cleanedGradeSubjects)) {
      form.setValue("gradeSubjects", cleanedGradeSubjects, {
        shouldValidate: true,
      });
    }
  }, [form.watch("selectedGrades")]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (values: FormValues) => {
      debug.startTimer("profile-submission");
      debug.log("Submitting form values", values);
      setIsSubmitting(true);
      
      try {
        if (!user?.id) {
          toast({
            title: "Error",
            description: "Not authenticated",
            variant: "destructive",
          });
          debug.error("Not authenticated");
          return;
        }

        // Transform form data to database format
        const teaching_subjects = Object.entries(
          values.gradeSubjects ?? {}
        ).flatMap(([grade, subjects]) =>
          (subjects ?? []).map((subject) => ({
            subject,
            grade,
          }))
        );
        
        debug.log("Processed teaching subjects", teaching_subjects);

        // Update profile in database
        const { error } = await supabase.from("profiles").upsert({
          id: user.id,
          full_name: values.full_name ?? "",
          grade_levels: values.selectedGrades ?? [],
          teaching_subjects:
            teaching_subjects.length > 0 ? teaching_subjects : [],
          updated_at: new Date().toISOString(),
          role: user.role,
        });

        if (error) {
          debug.error("Supabase update failed", error);
          toast({
            title: "Error",
            description:
              error instanceof Error ? error.message : "Failed to update profile",
            variant: "destructive",
          });
          return;
        };

        debug.info("Profile updated successfully");
        toast({
          title: "Profile updated",
          description: "Your teaching profile has been updated successfully.",
        });
        
        // Mark form as pristine after successful save
        form.reset(values);
      } catch (error) {
        debug.error("Profile update error", error);
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to update profile",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
        debug.endTimer("profile-submission");
      }
    },
    [toast, user, form]
  );

  // Memoize grade options to prevent unnecessary re-renders
  const gradeOptions = useMemo(getGradeOptions, []);

  // Get subject options for a specific grade
  const getSubjectOptionsForGrade = useCallback(
    (grade: string | undefined): Option[] => {
      if (
        !grade ||
        !Object.values(GRADE_LEVELS).includes(grade as GradeLevel)
      ) {
        return [];
      }

      const subjects = GRADE_SUBJECTS[grade as GradeLevel] ?? [];
      return subjects.map((subject) => ({
        label: subject ?? "",
        value: subject ?? "",
      }));
    },
    []
  );

  // Handle navigation with confirmation if form is dirty
  const handleNavigation = useCallback(() => {
    if (isDirty) {
      if (window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  }, [navigate, isDirty]);

  // Render fallback UI if no user
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <Card className="w-full max-w-2xl mx-auto p-4 sm:p-6">
          <p className="text-muted-foreground">
            Please sign in to view your profile
          </p>
        </Card>
      </div>
    );
  }

  const selectedGrades = form.watch("selectedGrades");

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      <Card className="w-full max-w-2xl mx-auto p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Teacher Profile</h1>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 sm:space-y-6"
          >
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Enter your full name"
                      disabled={isSubmitting}
                      aria-required="true"
                    />
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
                  <FormLabel>Grades You Teach</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={gradeOptions}
                      value={field.value ?? []}
                      onChange={(values) => field.onChange(values ?? [])}
                      placeholder="Select grades..."
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedGrades.map((grade) => (
              <FormField
                key={grade ?? "unknown"}
                control={form.control}
                name={`gradeSubjects.${grade}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Subjects for Grade {grade ?? "Unknown"}
                    </FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={getSubjectOptionsForGrade(grade)}
                        value={field.value ?? []}
                        onChange={(values) => field.onChange(values ?? [])}
                        placeholder={`Select subjects for Grade ${
                          grade ?? "Unknown"
                        }...`}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <div className="flex flex-col sm:flex-row justify-between mt-4 sm:mt-6 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleNavigation}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  !isDirty ||
                  !isValid
                }
                className="w-full sm:w-auto"
              >
                {isSubmitting ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
};
