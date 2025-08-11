import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ROUTES } from '@/config/routes';
import { UserRole } from '@/enums/user.enum';
import { logger } from '@/lib/logger';

const ssoLogger = logger.forModule("SSOLogin");

// SSO exchange now happens via Edge Function to establish Supabase session

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

        // Check if Supabase client is properly initialized
        if (!supabase) {
          ssoLogger.error("Supabase client not initialized. Check environment variables.");
          throw new Error('Database connection not available');
        }
        ssoLogger.debug("Invoking SSO exchange edge function");
        const { data, error } = await supabase.functions.invoke('sso-exchange', {
          body: {
            token,
            redirectTo: window.location.origin
          }
        });
        if (error) {
          ssoLogger.error('SSO exchange failed', error);
          throw error;
        }
        const actionLink = (data as any)?.action_link;
        if (!actionLink) {
          throw new Error('Invalid SSO exchange response');
        }
        // Redirect to establish Supabase session
        window.location.replace(actionLink);
        
      } catch (error) {
        ssoLogger.error('SSO login failed:', error);
        
        try {
          localStorage.removeItem('portfolio_user');
          localStorage.removeItem('portfolio_authenticated');
        } catch {}
        
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