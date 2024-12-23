# Authentication Flow

## Overview
The app uses Supabase for authentication with a custom role selection flow:

1. User signs up/signs in
2. System checks for user role
3. If no role exists, shows role selection modal
4. After role selection:
   - Students → /dashboard
   - Teachers → /assignments

## Key Files
- `src/integrations/supabase/client.ts` - Supabase client configuration
- `src/hooks/useAuthState.ts` - Central auth state management
- `src/components/auth/RoleSelectionModal.tsx` - Role selection UI
- `src/components/AppRoutes.tsx` - Route protection and role-based navigation

## Database Schema