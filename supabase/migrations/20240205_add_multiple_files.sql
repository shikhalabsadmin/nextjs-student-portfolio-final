-- Create a new table for assignment files
CREATE TABLE assignment_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add indexes
CREATE INDEX idx_assignment_files_assignment_id ON assignment_files(assignment_id);
CREATE INDEX idx_assignment_files_student_id ON assignment_files(student_id);

-- Enable RLS
ALTER TABLE assignment_files ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view files for assignments they can access" ON assignment_files
  FOR SELECT
  USING (
    -- Students can view their own files
    student_id = auth.uid()
    OR
    -- Or files from assignments they can access
    EXISTS (
      SELECT 1 FROM assignments a
      WHERE a.id = assignment_id
      AND (
        -- Student can view their own assignments
        a.student_id = auth.uid()
        OR
        -- Teachers can view assignments for their subjects and grades
        EXISTS (
          SELECT 1 FROM profiles teacher
          WHERE teacher.id = auth.uid()
          AND teacher.role = 'teacher'
          AND (
            a.grade = ANY(teacher.teaching_grades)
            AND EXISTS (
              SELECT 1
              FROM jsonb_array_elements(teacher.teaching_subjects) AS ts
              WHERE ts->>'subject' = a.subject
              AND ts->>'grade' = a.grade
            )
          )
        )
      )
    )
  );

-- Drop existing policy
DROP POLICY IF EXISTS "Students can insert files for their assignments" ON assignment_files;

-- Create updated policy for file insertion
CREATE POLICY "Students can insert their own files" ON assignment_files
  FOR INSERT
  WITH CHECK (
    -- Must be authenticated and inserting their own files
    auth.uid() = student_id
    AND (
      -- Allow files without assignment_id (temporary uploads)
      assignment_id IS NULL
      OR
      -- Or files with assignment_id that belongs to the student
      EXISTS (
        SELECT 1 FROM assignments a
        WHERE a.id = assignment_id
        AND a.student_id = auth.uid()
      )
    )
  );

-- Students can delete their own files
CREATE POLICY "Students can delete their own files" ON assignment_files
  FOR DELETE
  USING (
    student_id = auth.uid()
    AND (
      -- Allow deleting unassigned files
      assignment_id IS NULL
      OR
      -- Or files from draft assignments
      EXISTS (
        SELECT 1 FROM assignments a
        WHERE a.id = assignment_id
        AND a.student_id = auth.uid()
        AND a.status = 'DRAFT'
      )
    )
  );

-- Add trigger to update updated_at
CREATE TRIGGER set_assignment_files_updated_at
  BEFORE UPDATE ON assignment_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to migrate existing files
CREATE OR REPLACE FUNCTION migrate_existing_files() RETURNS void AS $$
BEGIN
  INSERT INTO assignment_files (assignment_id, file_url, file_name)
  SELECT 
    id as assignment_id,
    artifact_url as file_url,
    split_part(artifact_url, '/', -1) as file_name
  FROM assignments
  WHERE artifact_url IS NOT NULL
  AND artifact_url != ''
  AND artifact_url != '{}'
  AND artifact_url != 'undefined'
  AND artifact_url != 'null';
END;
$$ LANGUAGE plpgsql; 