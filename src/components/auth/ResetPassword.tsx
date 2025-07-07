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
import { Alert } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, UserRound } from "lucide-react";
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
  const [isSuccess, setIsSuccess] = useState(false);
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
      
      // Show success state
      setIsSuccess(true);
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
      title="Forgot your password?"
      description="Don't worry, we'll help you reset it!"
      toggleLabel="Remember your password?"
      toggleText="Sign in"
      onToggle={onToggleMode}
    >
      {isSuccess ? (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="bg-green-100 rounded-full p-4 mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="text-center font-medium mb-2">Magic link sent!</h3>
          <p className="text-center text-sm text-gray-600 mb-4">
            We've sent a password reset link to {form.getValues().email}
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-2 h-10 shadow-sm hover:shadow transition-all border-blue-200 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
            onClick={onToggleMode}
          >
            Back to Sign In
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleReset)} className="space-y-4">
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

            <Button 
              type="submit" 
              className="w-full h-11 mt-2 font-medium rounded-lg bg-blue-500 hover:bg-blue-600 text-white shadow-sm transition-all hover:shadow" 
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Magic Link"}
            </Button>
          </form>
        </Form>
      )}
    </AuthLayout>
  );
} 