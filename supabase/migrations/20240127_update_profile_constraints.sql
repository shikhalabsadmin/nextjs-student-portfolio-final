-- Drop existing constraints
ALTER TABLE profiles
  ALTER COLUMN full_name DROP NOT NULL;

-- Drop check constraint on role
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add strict check constraint for role (uppercase only)
ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('STUDENT', 'TEACHER'));

-- Update existing records to use uppercase
UPDATE profiles
  SET role = CASE 
    WHEN role = 'student' THEN 'STUDENT'
    WHEN role = 'teacher' THEN 'TEACHER'
    ELSE role
  END;

-- Initialize arrays as empty instead of null
ALTER TABLE profiles
  ALTER COLUMN subjects SET DEFAULT '[]',
  ALTER COLUMN grade_levels SET DEFAULT '[]',
  ALTER COLUMN teaching_subjects SET DEFAULT '[]'; 