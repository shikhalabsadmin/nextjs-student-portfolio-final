import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthState } from '@/hooks/useAuthState';
import { MultiSelect } from '@/components/ui/multi-select/index';

export function RoleSelectionModal() {
  const [role, setRole] = useState<'student' | 'teacher' | null>(null);
  const navigate = useNavigate();
  const { setUserRole, user } = useAuthState();

  const handleRoleSelect = async (selectedRole: 'student' | 'teacher') => {
    try {
      if (!user) return;

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { role: selectedRole }
      });
      if (updateError) throw updateError;

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          role: selectedRole,
          updated_at: new Date().toISOString()
        });
      if (profileError) throw profileError;

      // Update local state
      setUserRole(selectedRole);

      // Navigate based on role
      navigate(selectedRole === 'teacher' ? '/app/assignments' : '/app/dashboard');
    } catch (error) {
      console.error('Error setting role:', error);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Your Role</DialogTitle>
          <DialogDescription>Choose your role to continue</DialogDescription>
        </DialogHeader>
        
        <RadioGroup 
          value={role ?? undefined} 
          onValueChange={(value: 'student' | 'teacher') => setRole(value)}
        >
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="student" id="student" />
              <label htmlFor="student">Student</label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="teacher" id="teacher" />
              <label htmlFor="teacher">Teacher</label>
            </div>
          </div>
        </RadioGroup>

        <Button 
          onClick={() => handleRoleSelect(role as 'student' | 'teacher')} 
          disabled={!role}
          className="w-full"
        >
          {role ? "Continue" : "Select a role"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}