import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from '@/types/supabase';
import { grades } from '@/constants/grades';
import { formatGrade } from '@/lib/utils';
type Grade = Database['public']['Tables']['profiles']['Row']['grade'];

type Role = 'STUDENT' | 'TEACHER';

export function AuthForm() {
  console.log('[AuthForm] Component mounted');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [grade, setGrade] = useState<Grade>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[AuthForm] State updated:', { 
      isSignUp, 
      role, 
      grade, 
      loading,
      hasEmail: !!email,
      hasPassword: !!password
    });
  }, [isSignUp, role, grade, loading, email, password]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[AuthForm] handleAuth started with:', { 
      isSignUp, 
      email, 
      role, 
      grade,
      hasPassword: !!password 
    });
    setLoading(true);

    try {
      if (isSignUp) {
        console.log('[AuthForm] Starting signup process');
        
        // First sign up the user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
              role,
              grade: role === 'STUDENT' ? grade : null 
            },
            emailRedirectTo: window.location.origin
          }
        });
        
        console.log('[AuthForm] Signup response:', {
          success: !!signUpData?.user,
          userId: signUpData?.user?.id,
          error: signUpError,
          errorCode: signUpError?.status,
          errorMessage: signUpError?.message,
          metadata: signUpData?.user?.user_metadata,
          identities: signUpData?.user?.identities?.length
        });
        
        if (signUpError) {
          console.error('[AuthForm] Signup error:', {
            error: signUpError,
            context: {
              email,
              role,
              grade: role === 'STUDENT' ? grade : null
            }
          });
          throw signUpError;
        }
        if (!signUpData.user) throw new Error('No user data returned');

        // Get current session to verify auth state
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('[AuthForm] Current session state:', { 
          sessionExists: !!session,
          accessToken: !!session?.access_token,
          userId: session?.user?.id,
          error: sessionError,
          errorMessage: sessionError?.message
        });

        // Check if profile exists
        console.log('[AuthForm] Checking for existing profile');
        const { data: existingProfile, error: existingProfileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signUpData.user.id)
          .single();

        console.log('[AuthForm] Profile check result:', { 
          exists: !!existingProfile,
          error: existingProfileError,
          errorCode: existingProfileError?.code,
          errorMessage: existingProfileError?.message,
          details: existingProfileError?.details
        });

        // Prepare profile data
        const profileInput = {
          id: signUpData.user.id,
          role: role,
          grade: role === 'STUDENT' ? grade : null,
          full_name: email.split('@')[0],
          created_at: new Date().toISOString(),
          subjects: [],
          grade_levels: role === 'TEACHER' ? [] : null,
          teaching_subjects: role === 'TEACHER' ? [] : null,
        };

        console.log('[AuthForm] Attempting profile upsert with:', profileInput);

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .upsert(profileInput, {
            onConflict: 'id',
            ignoreDuplicates: false
          })
          .select()
          .single();

        console.log('[AuthForm] Profile upsert result:', {
          success: !!profileData,
          error: profileError,
          errorCode: profileError?.code,
          errorMessage: profileError?.message,
          details: profileError?.details,
          data: profileData
        });
        
        if (profileError) {
          console.error('[AuthForm] Profile creation failed:', {
            error: profileError,
            context: {
              userId: signUpData.user.id,
              hasSession: !!session,
              sessionUser: session?.user?.id,
              profileInput
            }
          });
          throw profileError;
        }

        // Check if email confirmation is required
        if (signUpData.user.identities?.length === 0) {
          console.log('[AuthForm] Email confirmation required');
          toast({
            title: "Account created!",
            description: "Please check your email to verify your account. You'll be able to sign in after verification.",
          });
          // Stay on the auth page for now
          setIsSignUp(false); // Switch to sign-in mode
          setEmail("");
          setPassword("");
          setRole("");
          setGrade(null);
        } else {
          console.log('[AuthForm] Email confirmation not required, proceeding with redirect');
          toast({
            title: "Account created!",
            description: "Your account has been created successfully.",
          });
          // Redirect to profile page for first-time setup
          const profilePath = role === 'STUDENT' ? '/app/student/profile' : '/app/teacher/profile';
          console.log('[AuthForm] Redirecting to:', profilePath);
          window.location.href = profilePath;
        }

      } else {
        // Sign in flow
        console.log('[AuthForm] Starting sign in process');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        console.log('[AuthForm] Sign in response:', {
          success: !!signInData?.user,
          userId: signInData?.user?.id,
          error: signInError,
          errorCode: signInError?.status,
          errorMessage: signInError?.message
        });

        if (signInError) {
          console.error('[AuthForm] Sign in error:', {
            error: signInError,
            context: { email }
          });
          throw signInError;
        }

        console.log('[AuthForm] Fetching user profile');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', signInData.user.id)
          .single();

        console.log('[AuthForm] Profile fetch result:', {
          success: !!profile,
          error: profileError,
          errorCode: profileError?.code,
          errorMessage: profileError?.message,
          data: profile
        });

        if (profileError) {
          console.error('[AuthForm] Profile fetch error:', {
            error: profileError,
            context: {
              userId: signInData.user.id
            }
          });
          throw profileError;
        }

        console.log('[AuthForm] Sign in successful, profile:', profile);

        toast({
          title: "Welcome back!"
        });

        // If full_name is just the email prefix, redirect to profile page
        const isDefaultName = profile?.full_name === email.split('@')[0];
        const redirectPath = isDefaultName
          ? (profile?.role === 'STUDENT' ? '/app/student/profile' : '/app/teacher/profile')
          : (profile?.role === 'STUDENT' ? '/app/dashboard' : '/app/assignments');

        console.log('[AuthForm] Redirecting to:', redirectPath);
        // Use window.location for full page reload
        window.location.href = redirectPath;
      }
    } catch (error) {
      console.error('[AuthForm] Auth error:', {
        error,
        context: {
          isSignUp,
          email,
          role,
          grade: role === 'STUDENT' ? grade : null
        }
      });
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('[AuthForm] Toggling auth mode from', isSignUp ? 'signup' : 'signin', 'to', !isSignUp ? 'signup' : 'signin');
    setIsSignUp(!isSignUp);
  };

  return (
    <div className="w-full max-w-md" id="auth-form">
      <div className="bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-semibold mb-2">
          {isSignUp ? "Create Account" : "Welcome Back"}
        </h2>
        <p className="text-gray-500 mb-6">
          {isSignUp 
            ? "Start your academic journey today" 
            : "Sign in to continue to your portfolio"
          }
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-4">
            {isSignUp && (
              <>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRole('STUDENT');
                      setGrade(null);
                    }}
                    className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all
                      ${role === 'STUDENT'
                        ? 'bg-[#62C59F] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRole('TEACHER');
                      setGrade(null);
                    }}
                    className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all
                      ${role === 'TEACHER'
                        ? 'bg-[#62C59F] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    Teacher
                  </button>
                </div>

                {/* Grade dropdown for students */}
                {role === 'STUDENT' && (
                  <Select 
                    value={grade || ''} 
                    onValueChange={(value) => setGrade(value as Grade)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((g) => (
                        <SelectItem key={g.value} value={g.value}>
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </>
            )}

            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-[#62C59F] hover:bg-[#51b88e]"
            disabled={loading || (isSignUp && (!role || (role === 'STUDENT' && !grade)))}
          >
            {loading ? "Loading..." : (isSignUp ? "Create Account" : "Sign In")}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
          <button
            onClick={toggleAuthMode}
            type="button"
            className="text-[#62C59F] hover:underline"
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}