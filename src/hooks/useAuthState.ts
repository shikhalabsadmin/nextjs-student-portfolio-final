import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAuthState = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Session check:', { session, error });

      if (session?.user) {
        setIsAuthenticated(true);
        const metadataRole = session.user.user_metadata?.role;
        console.log('User metadata:', session.user.user_metadata);
        
        if (metadataRole) {
          console.log('Role from metadata:', metadataRole);
          setUserRole(metadataRole);
        } else {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          console.log('Profile from DB:', profile);
          if (profile?.role) {
            setUserRole(profile.role);
          }
        }
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', { event, session });
      
      if (session?.user) {
        setIsAuthenticated(true);
        const role = session.user.user_metadata?.role;
        console.log('Role from session:', role);
        setUserRole(role);
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { isAuthenticated, userRole };
};