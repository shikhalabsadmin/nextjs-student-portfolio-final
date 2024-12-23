import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface RoleSelectionModalProps {
  isOpen: boolean;
  onRoleSelected: (role: string) => void;
}

export const RoleSelectionModal = ({ isOpen, onRoleSelected }: RoleSelectionModalProps) => {
  const [role, setRole] = useState<string>("student");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // 1. Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('1. Current user:', user);
      
      if (userError || !user) {
        throw new Error('Authentication error. Please try logging in again.');
      }

      // 2. Update profile
      console.log('2. Updating profile with role:', role);
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          role: role,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile error:', profileError);
        throw profileError;
      }

      // 3. Update metadata
      console.log('3. Updating user metadata...');
      const { error: updateError } = await supabase.auth.updateUser({
        data: { role }
      });

      if (updateError) {
        console.error('Metadata update error:', updateError);
        throw updateError;
      }

      console.log('4. All updates successful, reloading...');
      onRoleSelected(role);
      window.location.reload();
      
    } catch (err) {
      console.error('Error in role selection:', err);
      setError(err instanceof Error ? err.message : 'Failed to set role');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Your Role</DialogTitle>
          <DialogDescription>Choose your role to continue</DialogDescription>
        </DialogHeader>
        
        <RadioGroup value={role} onValueChange={setRole}>
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

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Setting role..." : "Continue"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};