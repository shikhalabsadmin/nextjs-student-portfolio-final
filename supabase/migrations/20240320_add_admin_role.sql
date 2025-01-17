-- 1. Allow ADMIN role in profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('TEACHER', 'STUDENT', 'ADMIN'));

-- 2. Create admin user in auth.users
INSERT INTO auth.users (
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  raw_app_meta_data,
  created_at,
  updated_at,
  role
) VALUES (
  'admin@shikha.ai',
  crypt('Shikha@labs2024', gen_salt('bf')),
  NOW(),
  jsonb_build_object('role', 'ADMIN'),
  jsonb_build_object('provider', 'email'),
  NOW(),
  NOW(),
  'authenticated'
) ON CONFLICT (email) DO NOTHING
RETURNING id;

-- 3. Create matching profile
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
)
SELECT 
  id,
  'admin@shikha.ai',
  'Admin User',
  'ADMIN',
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'admin@shikha.ai'
ON CONFLICT (id) DO NOTHING;

-- 4. Verify creation
SELECT id, email, role, raw_user_meta_data
FROM auth.users
WHERE email = 'admin@shikha.ai';

SELECT id, email, role, full_name
FROM public.profiles
WHERE email = 'admin@shikha.ai'; 