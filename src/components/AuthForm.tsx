import { useState } from "react";
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
import { Grade } from '@/types/profile';

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [grade, setGrade] = useState<Grade>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        console.log('1. Starting signup process...');
        
        // Sign up
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role }
          }
        });
        
        console.log('2. Signup response:', { signUpData, signUpError });
        
        if (signUpError) throw signUpError;
        if (!signUpData.user) throw new Error('No user data returned');

        console.log('3. User created with ID:', signUpData.user.id);
        console.log('4. User metadata:', signUpData.user.user_metadata);

        // Create or update profile with grade for students
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: signUpData.user.id,
            role: role,
            grade: role === 'student' ? grade : null,
          }, { onConflict: 'id' });

        console.log('5. Profile upsert result:', { profileData: signUpData.user, profileError });
        
        if (profileError) throw profileError;

        // Get session to confirm auth state
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('6. Current session:', { session, sessionError });

        toast({
          title: "Account created!",
          description: "Welcome to Portfolio System",
        });

        console.log('7. Redirecting to:', role === 'student' ? '/app/dashboard' : '/app/assignments');
        
        // Delay navigation slightly to ensure toast is visible
        setTimeout(() => {
          window.location.href = role === 'student' ? '/app/dashboard' : '/app/assignments';
        }, 1000);

      } else {
        // Sign in flow
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) throw signInError;

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', signInData.user.id)
          .single();

        toast({
          title: "Welcome back!"
        });

        // Use window.location for full page reload
        window.location.href = profile?.role === 'student' ? '/app/dashboard' : '/app/assignments';
      }
    } catch (error) {
      console.error('Auth error:', error);
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
                      setRole('student');
                      setGrade(null);
                    }}
                    className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all
                      ${role === 'student'
                        ? 'bg-[#62C59F] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRole('teacher');
                      setGrade(null);
                    }}
                    className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all
                      ${role === 'teacher'
                        ? 'bg-[#62C59F] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    Teacher
                  </button>
                </div>

                {/* Grade dropdown for students */}
                {role === 'student' && (
                  <Select 
                    value={grade || ''} 
                    onValueChange={(value) => setGrade(value as Grade)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {[7, 8, 9, 10, 11, 12].map((g) => (
                        <SelectItem key={g} value={g.toString()}>
                          Grade {g}
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
            disabled={loading || (isSignUp && (!role || (role === 'student' && !grade)))}
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