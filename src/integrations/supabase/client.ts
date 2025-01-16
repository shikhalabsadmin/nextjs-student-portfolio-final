import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with debug logging
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token',
    storage: localStorage
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js',
    }
  },
  db: {
    schema: 'public'
  }
});

// Add auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  console.log('[Supabase Client] Auth state change:', {
    event,
    hasSession: !!session,
    userId: session?.user?.id,
    accessToken: session?.access_token ? 'Present' : 'Missing',
    tokenExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'No expiry'
  });
});