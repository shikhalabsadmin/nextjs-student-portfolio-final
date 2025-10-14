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
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/config/routes";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

// Define form schema
const updatePasswordSchema = z.object({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>;

export function UpdatePassword() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const form = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Check for active session when component mounts with retry logic
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 5;
    const retryDelay = 500; // ms

    const checkSession = async (): Promise<boolean> => {
      try {
        console.log(`[UpdatePassword] Checking for active session (attempt ${retryCount + 1}/${maxRetries})...`);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("[UpdatePassword] Error getting session:", error);
          // Don't fail immediately on error, might be transient
          if (retryCount < maxRetries - 1) {
            return false;
          }
          toast({
            title: "Session Error",
            description: "Unable to verify your session. Please request a new password reset link.",
            variant: "destructive",
          });
          setIsCheckingSession(false);
          return true;
        }

        if (!session) {
          console.log("[UpdatePassword] No active session found");
          // PKCE flow might need a moment - retry before giving up
          if (retryCount < maxRetries - 1) {
            return false;
          }
          toast({
            title: "Session Expired",
            description: "Your password reset link has expired. Please request a new one.",
            variant: "destructive",
          });
          setTimeout(() => navigate(ROUTES.COMMON.HOME), 2000);
          setIsCheckingSession(false);
          return true;
        }

        console.log("[UpdatePassword] Session verified successfully");
        setIsSessionReady(true);
        setIsCheckingSession(false);
        return true;
      } catch (error) {
        console.error("[UpdatePassword] Unexpected error checking session:", error);
        if (retryCount < maxRetries - 1) {
          return false;
        }
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
        setIsCheckingSession(false);
        return true;
      }
    };

    const attemptWithRetry = async () => {
      const success = await checkSession();
      if (!success && retryCount < maxRetries - 1) {
        retryCount++;
        setTimeout(() => attemptWithRetry(), retryDelay);
      }
    };

    attemptWithRetry();
  }, [navigate, toast]);

  const updatePasswordMutation = useMutation({
    mutationFn: async (values: UpdatePasswordFormValues) => {
      const { error } = await supabase.auth.updateUser({
        password: values.password
      });

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Password updated successfully",
        description: "You can now sign in with your new password",
      });

      // Redirect to sign in
      navigate(ROUTES.COMMON.HOME);
    },
    onError: (error) => {
      console.error("[UpdatePassword] Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update password",
        variant: "destructive",
      });
    }
  });

  const handleUpdatePassword = (values: UpdatePasswordFormValues) => {
    updatePasswordMutation.mutate(values);
  };

  // Show loading state while checking session
  if (isCheckingSession) {
    return (
      <AuthLayout
        title="Update Password"
        description="Verifying your session..."
      >
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Please wait while we verify your password reset link...
          </p>
        </div>
      </AuthLayout>
    );
  }

  // Show error state if session is not ready
  if (!isSessionReady) {
    return (
      <AuthLayout
        title="Session Error"
        description="Unable to update password"
      >
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <p className="text-sm text-center text-muted-foreground">
            Your password reset link is invalid or has expired.
            <br />
            Please request a new password reset link.
          </p>
          <Button onClick={() => navigate(ROUTES.COMMON.HOME)} className="w-full">
            Go to Home
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Update Password"
      description="Enter your new password"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleUpdatePassword)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    {...field}
                  />
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
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={updatePasswordMutation.isPending}>
            {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
} 