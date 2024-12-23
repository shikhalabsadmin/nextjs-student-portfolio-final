import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useAuth = () => {
  const [showRoleModal, setShowRoleModal] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const checkUserProfile = async (userId: string) => {
    console.log('Checking user profile for:', userId);
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Profile check error:', error);
      throw error;
    }

    console.log('Profile found:', profile);
    return profile;
  };

  const handleAuthStateChange = async (event: string, session: any) => {
    console.log('Auth state changed:', { event, session });

    if (event === 'SIGNED_IN') {
      if (session?.user) {
        const profile = await checkUserProfile(session.user.id);
        if (!profile?.role) {
          setShowRoleModal(true);
        } else {
          if (profile.role === 'student') {
            navigate("/dashboard");
          } else if (profile.role === 'teacher') {
            navigate("/assignments");
          }
        }
      }
    } else if (event === 'SIGNED_OUT') {
      navigate("/");
    }
  };

  return {
    showRoleModal,
    setShowRoleModal,
    checkUserProfile,
    handleAuthStateChange
  };
};