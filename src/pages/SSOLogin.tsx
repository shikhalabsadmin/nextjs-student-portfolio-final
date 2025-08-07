import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import jwt from 'jsonwebtoken';
import { supabase } from '@/integrations/supabase/client';
import { ROUTES } from '@/config/routes';
import { UserRole } from '@/enums/user.enum';
import { logger } from '@/lib/logger';

const ssoLogger = logger.forModule("SSOLogin");

const SHARED_SECRET = import.meta.env.VITE_PORTFOLIO_SHARED_SECRET;

interface SSOUserData {
  user_id: string;
  email: string;
  full_name: string;
  role: 'STUDENT' | 'TEACHER' | 'PARENT' | 'ADMIN';
  grade?: string;
  subjects?: string[];
  bio?: string;
  school_name?: string;
  workspace_id: string;
  workspace_role: string;
  source: string;
}

export default function SSOLogin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleSSO = async () => {
      try {
        ssoLogger.info("Starting SSO login process");
        
        const token = searchParams.get('token');
        if (!token) {
          throw new Error('No SSO token provided');
        }

        if (!SHARED_SECRET) {
          throw new Error('SSO shared secret not configured');
        }

        // Check if Supabase client is properly initialized
        if (!supabase) {
          ssoLogger.error("Supabase client not initialized. Check environment variables.");
          throw new Error('Database connection not available');
        }

        ssoLogger.debug("Validating JWT token");
        
        // Validate JWT token
        const userData = jwt.verify(token, SHARED_SECRET) as SSOUserData;
        ssoLogger.info('SSO Login - User data verified:', { 
          userId: userData.user_id, 
          email: userData.email, 
          role: userData.role,
          source: userData.source 
        });
        
        // Database operations with proper error handling
        try {
          // First, check if user exists by EMAIL (for account linking)
          const { data: existingProfileByEmail, error: emailError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', userData.email)
            .single();

          if (emailError && emailError.code !== 'PGRST116') {
            // Error other than "not found"
            ssoLogger.error("Error checking existing profile by email:", emailError);
            throw emailError;
          }

          // Then check if user exists by AI Learning user_id  
          const { data: existingProfileById, error: idError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userData.user_id)
            .single();

          if (idError && idError.code !== 'PGRST116') {
            // Error other than "not found"
            ssoLogger.error("Error checking existing profile by ID:", idError);
            throw idError;
          }

          // Handle different account linking scenarios
          if (existingProfileByEmail && existingProfileById) {
            // User exists by both email AND ID - normal update
            ssoLogger.debug("User exists by both email and ID - updating profile");
            const profileToUpdate = existingProfileById;
            
            const { error: updateError } = await supabase.from('profiles').update({
              first_name: userData.full_name?.split(' ')[0] || '',
              last_name: userData.full_name?.split(' ').slice(1).join(' ') || '',
              role: userData.role as UserRole,
              bio: userData.bio || null,
              updated_at: new Date().toISOString(),
              sync_source: userData.source,
              ai_learning_user_id: userData.user_id
            }).eq('id', profileToUpdate.id);

            if (updateError) {
              ssoLogger.error("Error updating profile:", updateError);
              throw updateError;
            }
            
          } else if (existingProfileByEmail && !existingProfileById) {
            // ACCOUNT LINKING: User exists in Portfolio but never came from AI Learning
            ssoLogger.info("Linking existing Portfolio account with AI Learning", {
              portfolioUserId: existingProfileByEmail.id,
              aiLearningUserId: userData.user_id,
              email: userData.email
            });
            
            const { error: linkError } = await supabase.from('profiles').update({
              first_name: userData.full_name?.split(' ')[0] || '',
              last_name: userData.full_name?.split(' ').slice(1).join(' ') || '',
              role: userData.role as UserRole,
              bio: userData.bio || null,
              updated_at: new Date().toISOString(),
              sync_source: userData.source,
              ai_learning_user_id: userData.user_id, // Link the AI Learning ID
              linked_at: new Date().toISOString()
            }).eq('id', existingProfileByEmail.id);

            if (linkError) {
              ssoLogger.error("Error linking accounts:", linkError);
              throw linkError;
            }

            // Use the existing Portfolio user ID for authentication
            userData.user_id = existingProfileByEmail.id;
            
          } else if (!existingProfileByEmail && existingProfileById) {
            // User exists by AI Learning ID but different email - update email
            ssoLogger.debug("Updating email for existing AI Learning user");
            
            const { error: updateError } = await supabase.from('profiles').update({
              email: userData.email,
              first_name: userData.full_name?.split(' ')[0] || '',
              last_name: userData.full_name?.split(' ').slice(1).join(' ') || '',
              role: userData.role as UserRole,
              bio: userData.bio || null,
              updated_at: new Date().toISOString(),
              sync_source: userData.source
            }).eq('id', userData.user_id);

            if (updateError) {
              ssoLogger.error("Error updating profile:", updateError);
              throw updateError;
            }
            
          } else {
            // NEW USER: Create fresh account from AI Learning
            ssoLogger.debug("Creating new user profile from AI Learning");
            const { error: insertError } = await supabase.from('profiles').insert({
              id: userData.user_id,
              email: userData.email,
              first_name: userData.full_name?.split(' ')[0] || '',
              last_name: userData.full_name?.split(' ').slice(1).join(' ') || '',
              role: userData.role as UserRole,
              bio: userData.bio || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              sync_source: userData.source,
              ai_learning_user_id: userData.user_id, // Same as ID for new users
              linked_at: new Date().toISOString()
            });

            if (insertError) {
              ssoLogger.error("Error creating profile:", insertError);
              throw insertError;
            }
          }
        } catch (dbError) {
          ssoLogger.error("Database operation failed:", dbError);
          throw new Error('Failed to sync user profile. Please try again.');
        }

        // Store user data in localStorage for your app
        const portfolioUser = {
          id: userData.user_id,
          email: userData.email,
          name: userData.full_name,
          role: userData.role,
          workspace_id: userData.workspace_id,
          source: userData.source
        };

        localStorage.setItem('portfolio_user', JSON.stringify(portfolioUser));
        localStorage.setItem('portfolio_authenticated', 'true');

        ssoLogger.info("SSO login successful, redirecting user", { role: userData.role });

        // Redirect based on role
        if (userData.role === 'TEACHER' || userData.role === 'ADMIN') {
          navigate(ROUTES.TEACHER.DASHBOARD, { replace: true });
        } else {
          navigate(ROUTES.STUDENT.DASHBOARD, { replace: true });
        }
        
      } catch (error) {
        ssoLogger.error('SSO login failed:', error);
        
        // Clear any partial auth state
        localStorage.removeItem('portfolio_user');
        localStorage.removeItem('portfolio_authenticated');
        
        // Redirect to login with error message
        navigate(`${ROUTES.COMMON.HOME}?error=sso_failed`, { replace: true });
      }
    };

    handleSSO();
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Signing you in...</h2>
        <p className="text-sm text-gray-600">Please wait while we verify your credentials</p>
        <div className="mt-4">
          <div className="flex justify-center items-center space-x-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}