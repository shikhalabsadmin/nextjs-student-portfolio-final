ALTER TABLE profiles
ADD COLUMN teaching_subjects JSONB DEFAULT '[]'::jsonb,
ADD COLUMN teaching_grades TEXT[] DEFAULT '{}'::text[];

-- Add index for performance
CREATE INDEX idx_profiles_teaching_subjects ON profiles USING GIN (teaching_subjects);
CREATE INDEX idx_profiles_teaching_grades ON profiles USING GIN (teaching_grades); 