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

// Define form schema
const resetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ResetFormValues = z.infer<typeof resetSchema>;

interface ResetPasswordProps {
  onToggleMode: (e: React.MouseEvent) => void;
}

export function ResetPassword({ onToggleMode }: ResetPasswordProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleReset = async (values: ResetFormValues) => {
    console.log("[ResetPassword] Starting password reset process");
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) throw error;

      toast({
        title: "Reset email sent",
        description: "Please check your email for the password reset link.",
      });

      // Switch back to sign in
      onToggleMode(new MouseEvent("click") as unknown as React.MouseEvent);
    } catch (error) {
      console.error("[ResetPassword] Error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      description="Enter your email to reset your password"
      toggleLabel="Remember your password? "
      toggleText="Sign in"
      onToggle={onToggleMode}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleReset)} className="space-y-4">
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
} 