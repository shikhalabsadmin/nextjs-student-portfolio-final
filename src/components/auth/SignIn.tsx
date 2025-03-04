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
import { AuthLayout } from "./AuthLayout";
import { UserRole } from "@/enums/user.enum";
import { ROUTES } from "@/config/routes";

// Define form schema
const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type SignInFormValues = z.infer<typeof signInSchema>;

interface SignInProps {
  onToggleMode: (e: React.MouseEvent) => void;
}

export function SignIn({ onToggleMode }: SignInProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Initialize form with react-hook-form
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSignIn = async (values: SignInFormValues) => {
    console.log("[SignIn] Starting sign in process");
    setLoading(true);

    try {
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });

      console.log("[SignIn] Sign in response:", {
        success: !!signInData?.user,
        userId: signInData?.user?.id,
        error: signInError,
        errorCode: signInError?.status,
        errorMessage: signInError?.message,
      });

      if (signInError) {
        console.error("[SignIn] Sign in error:", {
          error: signInError,
          context: { email: values.email },
        });
        throw signInError;
      }

      console.log("[SignIn] Fetching user profile");
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", signInData.user.id)
        .single();

      console.log("[SignIn] Profile fetch result:", {
        success: !!profile,
        error: profileError,
        errorCode: profileError?.code,
        errorMessage: profileError?.message,
        data: profile,
      });

      if (profileError) {
        console.error("[SignIn] Profile fetch error:", {
          error: profileError,
          context: {
            userId: signInData.user.id,
          },
        });
        throw profileError;
      }

      console.log("[SignIn] Sign in successful, profile:", profile);

      toast({
        title: "Welcome back!",
      });

      // If full_name is just the email prefix, redirect to profile page
      const isDefaultName = profile?.full_name === values.email.split("@")[0];
      const redirectPath = isDefaultName
        ? profile?.role === UserRole.STUDENT
          ? ROUTES.STUDENT.PROFILE
          : ROUTES.TEACHER.PROFILE
        : profile?.role === UserRole.STUDENT
        ? ROUTES.STUDENT.DASHBOARD
        : ROUTES.TEACHER.ASSIGNMENTS;

      console.log("[SignIn] Redirecting to:", redirectPath);
      // Use window.location for full page reload
      window.location.href = redirectPath;
    } catch (error) {
      console.error("[SignIn] Auth error:", {
        error,
        context: {
          email: values.email,
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
      title="Welcome Back"
      description="Sign in to continue to your portfolio"
      toggleLabel="Don't have an account? "
      toggleText="Sign up"
      onToggle={onToggleMode}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSignIn)} className="space-y-4">
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
            {loading ? "Loading..." : "Sign In"}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
