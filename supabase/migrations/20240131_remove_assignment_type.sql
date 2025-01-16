-- Drop assignment grouping related tables and functions
DROP FUNCTION IF EXISTS find_matching_assignment_group;
DROP TABLE IF EXISTS assignment_groups CASCADE;

-- Remove type column and group_id from assignments if they exist
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'type') THEN
        ALTER TABLE assignments DROP COLUMN type;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'group_id') THEN
        ALTER TABLE assignments DROP COLUMN group_id;
    END IF;
END $$;

-- Update RLS policies
DROP POLICY IF EXISTS "Students can view their own assignments" ON assignments;
DROP POLICY IF EXISTS "Students can create assignments" ON assignments;
DROP POLICY IF EXISTS "Students can update their own assignments" ON assignments;
DROP POLICY IF EXISTS "Teachers can view assignments for their grade and subject" ON assignments;

CREATE POLICY "Students can view their own assignments"
ON assignments FOR SELECT
TO authenticated
USING (
  auth.uid() = student_id
);

CREATE POLICY "Students can create assignments"
ON assignments FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = student_id
);

CREATE POLICY "Students can update their own draft or needs_revision assignments"
ON assignments FOR UPDATE
TO authenticated
USING (
  auth.uid() = student_id
  AND status IN ('DRAFT', 'NEEDS_REVISION')
)
WITH CHECK (
  auth.uid() = student_id
  AND status IN ('DRAFT', 'NEEDS_REVISION')
);

CREATE POLICY "Teachers can view assignments for their grade and subject"
ON assignments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'TEACHER'
    AND grade = ANY(grade_levels)
    AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(teaching_subjects) AS ts
      WHERE ts->>'subject' = assignments.subject
    )
  )
); 