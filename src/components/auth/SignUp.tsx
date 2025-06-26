import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AuthLayout } from "./AuthLayout";
import { UserRole } from "@/enums/user.enum";
import { ROUTES } from "@/config/routes";
import { GRADE_LEVELS } from "@/constants/grade-subjects";
import { STUDENT_PROFILE_DEFAULTS } from "@/constants/student-profile-defaults";


// Define form schema
const signUpSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.nativeEnum(UserRole, {
      required_error: "Please select a role",
    }),
    grade: z.string().optional(),
  })
  .refine(
    (data) => {
      // If role is STUDENT, grade is required
      return data.role !== UserRole.STUDENT || !!data.grade;
    },
    {
      message: "Grade is required for students",
      path: ["grade"],
    }
  );

type SignUpFormValues = z.infer<typeof signUpSchema>;

interface SignUpProps {
  onToggleMode: (e: React.MouseEvent) => void;
}

export function SignUp({ onToggleMode }: SignUpProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Initialize form with react-hook-form
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      role: UserRole.STUDENT,
      grade: undefined,
    },
  });

  // Get form values
  const role = form.watch("role");

  const handleSignUp = async (values: SignUpFormValues) => {
    console.log("[SignUp] Starting signup process");
    setLoading(true);

    try {
      // First sign up the user
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              role: values.role,
              grade: values.role === UserRole.STUDENT ? values.grade : null,
            },
            emailRedirectTo: window.location.origin,
          },
        });

      console.log("[SignUp] Signup response:", {
        success: !!signUpData?.user,
        userId: signUpData?.user?.id,
        error: signUpError,
        errorCode: signUpError?.status,
        errorMessage: signUpError?.message,
        metadata: signUpData?.user?.user_metadata,
        identities: signUpData?.user?.identities?.length,
      });

      if (signUpError) {
        console.error("[SignUp] Signup error:", {
          error: signUpError,
          context: {
            email: values.email,
            role: values.role,
            grade: values.role === UserRole.STUDENT ? values.grade : null,
          },
        });
        throw signUpError;
      }
      if (!signUpData.user) throw new Error("No user data returned");

      // Get current session to verify auth state
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      console.log("[SignUp] Current session state:", {
        sessionExists: !!session,
        accessToken: !!session?.access_token,
        userId: session?.user?.id,
        error: sessionError,
        errorMessage: sessionError?.message,
      });

      // Check if profile exists
      console.log("[SignUp] Checking for existing profile");
      const { data: existingProfile, error: existingProfileError } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", signUpData.user.id)
          .single();

      console.log("[SignUp] Profile check result:", {
        exists: !!existingProfile,
        error: existingProfileError,
        errorCode: existingProfileError?.code,
        errorMessage: existingProfileError?.message,
        details: existingProfileError?.details,
      });

      // Prepare profile data with defaults for students
      const profileInput = {
        id: signUpData.user.id,
        role: values.role,
        grade: values.role === UserRole.STUDENT ? values.grade : null,
        full_name: values.email.split("@")[0],
        created_at: new Date().toISOString(),
        subjects: [],
        grade_levels: values.role === UserRole.TEACHER ? [] : null,
        teaching_subjects: values.role === UserRole.TEACHER ? [] : null,
        // Add default school and bio for students
        ...(values.role === UserRole.STUDENT && {
          school_name: STUDENT_PROFILE_DEFAULTS.school,
          bio: STUDENT_PROFILE_DEFAULTS.bio,
        }),
      };

      console.log("[SignUp] Attempting profile upsert with:", profileInput);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .upsert(profileInput, {
          onConflict: "id",
          ignoreDuplicates: false,
        })
        .select()
        .single();

      console.log("[SignUp] Profile upsert result:", {
        success: !!profileData,
        error: profileError,
        errorCode: profileError?.code,
        errorMessage: profileError?.message,
        details: profileError?.details,
        data: profileData,
      });

      if (profileError) {
        console.error("[SignUp] Profile creation failed:", {
          error: profileError,
          context: {
            userId: signUpData.user.id,
            hasSession: !!session,
            sessionUser: session?.user?.id,
            profileInput,
          },
        });
        throw profileError;
      }

      // Check if email confirmation is required
      if (signUpData.user.identities?.length === 0) {
        console.log("[SignUp] Email confirmation required");
        toast({
          title: "Account created!",
          description:
            "Please check your email to verify your account. You'll be able to sign in after verification.",
        });
        // Stay on the auth page for now
        onToggleMode(new MouseEvent("click") as unknown as React.MouseEvent); // Switch to sign-in mode
        form.reset();
      } else {
        console.log(
          "[SignUp] Email confirmation not required, proceeding with redirect"
        );
        toast({
          title: "Account created!",
          description: "Your account has been created successfully.",
        });
        // Redirect to profile page for first-time setup
        const profilePath =
          values.role === UserRole.STUDENT
            ? ROUTES.STUDENT.DASHBOARD
            : ROUTES.TEACHER.PROFILE;
        console.log("[SignUp] Redirecting to:", profilePath);
        window.location.href = profilePath;
      }
    } catch (error) {
      console.error("[SignUp] Auth error:", {
        error,
        context: {
          email: values.email,
          role: values.role,
          grade: values.role === UserRole.STUDENT ? values.grade : null,
        },
      });
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      description="Start your academic journey today"
      toggleLabel="Already have an account? "
      toggleText="Sign in"
      onToggle={onToggleMode}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-4">
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <ToggleGroup
                    type="single"
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (value === UserRole.TEACHER) {
                        form.setValue("grade", undefined);
                      }
                    }}
                    className="flex gap-3"
                  >
                    <ToggleGroupItem
                      value={UserRole.STUDENT}
                      className="flex-1 py-2.5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                      {UserRole.STUDENT.toLowerCase()}
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value={UserRole.TEACHER}
                      className="flex-1 py-2.5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                      {UserRole.TEACHER.toLowerCase()}
                    </ToggleGroupItem>
                  </ToggleGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Grade dropdown for students */}
          {role === UserRole.STUDENT && (
            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your grade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object?.values(GRADE_LEVELS ?? {}).map((e) => (
                        <SelectItem key={e} value={e}>
                          {e}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Loading..." : "Create Account"}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
