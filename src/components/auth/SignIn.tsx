import { useState, useEffect } from "react";
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
import { Alert } from "@/components/ui/alert";
import { AlertCircle, UserRound, Lock } from "lucide-react";
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
  onResetPassword: (e: React.MouseEvent) => void;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export function SignIn({ onToggleMode, onResetPassword }: SignInProps) {
  const [loading, setLoading] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const { toast } = useToast();

  // Check for existing lockout on component mount
  useEffect(() => {
    const storedLockout = localStorage.getItem('auth_lockout');
    if (storedLockout) {
      const lockoutTime = parseInt(storedLockout);
      if (lockoutTime > Date.now()) {
        setLockoutUntil(lockoutTime);
      } else {
        localStorage.removeItem('auth_lockout');
      }
    }
  }, []);

  // Initialize form with react-hook-form
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSignIn = async (values: SignInFormValues) => {
    // Check for lockout
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const minutesLeft = Math.ceil((lockoutUntil - Date.now()) / 60000);
      toast({
        title: "Account temporarily locked",
        description: `Too many failed attempts. Please try again in ${minutesLeft} minutes.`,
        variant: "destructive",
      });
      return;
    }

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
        // Increment attempt count on failure
        const newAttemptCount = attemptCount + 1;
        setAttemptCount(newAttemptCount);

        // Check if we should lockout
        if (newAttemptCount >= MAX_ATTEMPTS) {
          const lockoutTime = Date.now() + LOCKOUT_DURATION;
          setLockoutUntil(lockoutTime);
          localStorage.setItem('auth_lockout', lockoutTime.toString());
          toast({
            title: "Account temporarily locked",
            description: "Too many failed attempts. Please try again in 15 minutes.",
            variant: "destructive",
          });
          return;
        }

        console.error("[SignIn] Sign in error:", {
          error: signInError,
          context: { email: values.email },
        });
        throw signInError;
      }

      // Reset attempt count on successful login
      setAttemptCount(0);
      localStorage.removeItem('auth_lockout');

      console.log("========================================");
      console.log("[SignIn] 🔍 DIAGNOSTIC: Fetching user profile");
      console.log("[SignIn] 📋 User ID from auth:", signInData.user.id);
      console.log("[SignIn] 📧 Email:", values.email);
      console.log("[SignIn] 🔑 User metadata:", signInData.user.user_metadata);
      console.log("========================================");
      
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, full_name, email")
        .eq("id", signInData.user.id)
        .single();

      console.log("========================================");
      console.log("[SignIn] 📊 PROFILE FETCH RESULT:");
      console.log("[SignIn] ✅ Success:", !!profile);
      console.log("[SignIn] 📦 Profile data:", profile);
      console.log("[SignIn] ❌ Error exists:", !!profileError);
      
      if (profileError) {
        console.log("[SignIn] 🚨 ERROR DETAILS:");
        console.log("[SignIn]   - Code:", profileError.code);
        console.log("[SignIn]   - Message:", profileError.message);
        console.log("[SignIn]   - Details:", profileError.details);
        console.log("[SignIn]   - Hint:", profileError.hint);
        console.log("[SignIn]   - Full error object:", JSON.stringify(profileError, null, 2));
        console.log("========================================");
        
        console.error("[SignIn] Profile fetch error:", {
          error: profileError,
          context: {
            userId: signInData.user.id,
            email: values.email,
          },
        });
        
        toast({
          title: "Database Error",
          description: `Error: ${profileError.message} (Code: ${profileError.code}). Check browser console for details.`,
          variant: "destructive",
        });
        throw profileError;
      }
      
      console.log("[SignIn] ✅ Profile fetch successful");
      console.log("========================================");

      console.log("[SignIn] Sign in successful, profile:", profile);

      toast({
        title: "Welcome back!",
      });

      // Determine redirect path based on user role
      let redirectPath;
      switch (profile?.role) {
        case UserRole.STUDENT:
          redirectPath = ROUTES.STUDENT.DASHBOARD;
          break;
        case UserRole.TEACHER:
          redirectPath = ROUTES.TEACHER.DASHBOARD;
          break;
        case UserRole.ADMIN:
          redirectPath = ROUTES.ADMIN.DASHBOARD;
          break;
        default:
          redirectPath = ROUTES.COMMON.HOME;
      }

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
      title="Welcome back!"
      description="Continue your learning journey"
      toggleLabel="Don't have an account?"
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
                <div className="flex justify-between items-center mb-1">
                  <FormLabel className="text-sm font-medium">Password</FormLabel>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-xs font-normal text-gray-500 hover:text-blue-500"
                    type="button"
                    onClick={onResetPassword}
                  >
                    Forgot password?
                  </Button>
                </div>
                <FormControl>
                  <div className="relative">
                    <div className="absolute left-3 top-2.5 h-4 w-4 text-blue-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input
                      type="password"
                      placeholder="Password"
                      autoComplete="current-password"
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
            {loading ? "Signing In..." : "Let's Go!"}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
