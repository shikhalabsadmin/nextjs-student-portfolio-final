import { supabase } from "@/integrations/supabase/client";
import { debugAuth } from "@/lib/utils/debug.service";
import { User } from "@supabase/supabase-js";

/**
 * Service for authentication operations
 */
export class AuthService {
  /**
   * Get the current authenticated user
   */
  static async getCurrentUser(): Promise<User> {
    debugAuth.step('Authenticating user');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      debugAuth.error('Authentication failed', userError);
      throw userError;
    }
    
    if (!user) {
      debugAuth.error('No authenticated user found');
      throw new Error("No authenticated user");
    }
    
    debugAuth.info('User authenticated', { userId: user.id });
    return user;
  }

  /**
   * Check if a user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch (error) {
      debugAuth.info('User is not authenticated');
      return false;
    }
  }

  /**
   * Get user profile data from the database
   */
  static async getUserProfile<T>(userId: string): Promise<T | null> {
    try {
      debugAuth.step('Fetching user profile', { userId });
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        debugAuth.error('User profile fetch failed', error);
        return null;
      }
      
      debugAuth.info('User profile retrieved');
      return data as T;
    } catch (error) {
      debugAuth.error('User profile fetch error', error);
      return null;
    }
  }

  /**
   * Get specific metadata for a user
   */
  static async getUserMetadata<T>(key: string): Promise<T | null> {
    try {
      const user = await this.getCurrentUser();
      const metadata = user.user_metadata;
      
      if (!metadata || !(key in metadata)) {
        debugAuth.info(`User metadata '${key}' not found`);
        return null;
      }
      
      debugAuth.info(`User metadata '${key}' retrieved`);
      return metadata[key] as T;
    } catch (error) {
      debugAuth.error(`User metadata '${key}' fetch error`, error);
      return null;
    }
  }
} 