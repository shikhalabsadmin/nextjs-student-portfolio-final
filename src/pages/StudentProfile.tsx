import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { GRADE_LEVELS } from "@/constants/grade-subjects";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "@supabase/supabase-js";
import { PostgrestError } from "@supabase/supabase-js";

// Schema
const formSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  grade: z.string().min(1, "Grade is required"),
});

type FormValues = z.infer<typeof formSchema>;

type Profile = {
  id: string;
  full_name: string;
  grade: string | null;
  role: string;
};

// Logging Utility
const log = (message: string, context?: Record<string, unknown>) => {
  console.log(`[StudentProfile] ${message}`, context || {});
};

// Error Handler Utility
const handleError = (toast: ReturnType<typeof useToast>["toast"]) => (
  error: PostgrestError | Error | null,
  context: string
) => {
  console.error(`[StudentProfile] ${context} failed`, { error });
  toast({
    title: "Error",
    description: `Failed to ${context.toLowerCase()}. Please try again.`,
    variant: "destructive",
  });
};

// Custom Hook for Profile Management
const useStudentProfile = (user: User | null) => {
  const { toast } = useToast();

  const fetchProfile = async (): Promise<Profile | null> => {
    if (!user) {
      log("No user found, skipping profile fetch");
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, grade, role")
      .eq("id", user.id)
      .single();

    if (error) {
      handleError(toast)(error, "Fetch profile");
      return null;
    }
    log("Profile fetched", { data });
    return data as Profile;
  };

  const syncGrade = async (profile: Profile): Promise<Profile> => {
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      handleError(toast)(userError, "Get user for grade sync");
      return profile;
    }

    if (!profile.grade && currentUser?.user_metadata?.grade) {
      const gradeFromMetadata = currentUser.user_metadata.grade as string;
      const { error } = await supabase
        .from("profiles")
        .update({ grade: gradeFromMetadata })
        .eq("id", user.id);
      if (error) {
        handleError(toast)(error, "Sync grade");
        return profile;
      }
      profile.grade = gradeFromMetadata;
      log("Grade synced", { grade: profile.grade });
    }
    return profile;
  };

  const { data: profile, refetch } = useQuery({
    queryKey: ["student-profile"],
    enabled: !!user,
    queryFn: async () => {
      const profileData = await fetchProfile();
      return profileData ? await syncGrade(profileData) : null;
    },
  });

  const updateProfile = async (values: FormValues): Promise<void> => {
    if (!user) {
      toast({
        title: "Error",
        description: "Not authenticated. Please log in.",
        variant: "destructive",
      });
      return;
    }

    const { error: userUpdateError } = await supabase.auth.updateUser({
      data: { grade: values.grade },
    });
    if (userUpdateError) {
      handleError(toast)(userUpdateError, "Update metadata");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: values.full_name, grade: values.grade })
      .eq("id", user.id);
    if (error) {
      handleError(toast)(error, "Update profile");
      return;
    }

    log("Profile updated", { values });
    await refetch();
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully.",
    });
  };

  return { profile, updateProfile, refetch };
};

// UI Component
export const StudentProfile = ({ user }: { user: User }) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profile, updateProfile } = useStudentProfile(user);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { full_name: "", grade: "" },
  });

  // Update form when profile loads
  if (profile && form.getValues("full_name") !== profile.full_name) {
    form.reset({
      full_name: profile.full_name || "",
      grade: profile.grade || "",
    });
  }

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    await updateProfile(values);
    setIsSubmitting(false);
  };

  if (!user) return null;

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
                      {Object.values(GRADE_LEVELS).map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          Grade {grade}
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
                onClick={() => navigate(-1)} // Navigate to previous page
              >
                Back
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
};