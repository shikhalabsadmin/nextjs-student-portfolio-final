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
import { Alert } from "@/components/ui/alert";
import { AlertCircle, UserRound, Lock, GraduationCap, School } from "lucide-react";
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
    confirmPassword: z.string().min(6, "Please confirm your password"),
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
  )
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
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
      confirmPassword: "",
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
      title="Join the adventure!"
      description="Create your account to get started"
      toggleLabel="Already have an account?"
      toggleText="Sign in"
      onToggle={onToggleMode}
      isSignUp={true}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-4">
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="flex space-x-2 mb-1">
                    <button
                      type="button"
                      onClick={() => {
                        field.onChange(UserRole.STUDENT);
                        if (field.value === UserRole.TEACHER) {
                          form.setValue("grade", undefined);
                        }
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                        field.value === UserRole.STUDENT
                          ? "bg-blue-500 text-white"
                          : "bg-blue-50 text-gray-600 hover:bg-blue-100"
                      }`}
                    >
                      <GraduationCap className="h-4 w-4 mr-1.5" />
                      Student
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        field.onChange(UserRole.TEACHER);
                        form.setValue("grade", undefined);
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                        field.value === UserRole.TEACHER
                          ? "bg-blue-500 text-white"
                          : "bg-blue-50 text-gray-600 hover:bg-blue-100"
                      }`}
                    >
                      <School className="h-4 w-4 mr-1.5" />
                      Teacher
                    </button>
                  </div>
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
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-10 rounded-lg bg-blue-50/50 border-blue-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-300">
                        <SelectValue placeholder="Select your grade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object?.values(GRADE_LEVELS ?? {}).map((e) => (
                        <SelectItem key={e} value={e}>
                          Grade {e}
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
                <FormControl>
                  <div className="relative">
                    <div className="absolute left-3 top-2.5 h-4 w-4 text-blue-500">
                      <UserRound className="h-4 w-4" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Email"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect="off"
                      className="pl-9 h-10 rounded-lg bg-blue-50/50 border-blue-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-300"
                      {...field}
                    />
                  </div>
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
                <FormControl>
                  <div className="relative">
                    <div className="absolute left-3 top-2.5 h-4 w-4 text-blue-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Password"
                      autoCapitalize="none"
                      autoComplete="new-password"
                      autoCorrect="off"
                      className="pl-9 h-10 rounded-lg bg-blue-50/50 border-blue-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-300"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <div className="absolute left-3 top-2.5 h-4 w-4 text-blue-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm Password"
                      autoCapitalize="none"
                      autoComplete="new-password"
                      autoCorrect="off"
                      className="pl-9 h-10 rounded-lg bg-blue-50/50 border-blue-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-300"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-11 mt-2 font-medium rounded-lg bg-blue-500 hover:bg-blue-600 text-white shadow-sm transition-all hover:shadow"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Start Your Journey!"}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
