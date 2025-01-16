-- Enable RLS on assignments table
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Students can view their own assignments and teacher-created assignments
CREATE POLICY "Students can view their own assignments and teacher assignments"
ON assignments FOR SELECT
USING (
  student_id = auth.uid()
  OR (
    type = 'TEACHER_CREATED'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'STUDENT'
    )
  )
);

-- Students can create their own assignments
CREATE POLICY "Students can create their own assignments"
ON assignments FOR INSERT
TO authenticated
WITH CHECK (
  student_id = auth.uid()
  AND type = 'STUDENT_INITIATED'
);

-- Students can update their own assignments
CREATE POLICY "Students can update their own assignments"
ON assignments FOR UPDATE
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- Students can delete their own draft assignments
CREATE POLICY "Students can delete their own draft assignments"
ON assignments FOR DELETE
USING (student_id = auth.uid() AND LOWER(status) = 'DRAFT');

-- Teachers can view assignments for their subjects
CREATE POLICY "Teachers can view assignments"
ON assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'TEACHER'
  )
);

-- Teachers can create assignments
CREATE POLICY "Teachers can create assignments"
ON assignments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'TEACHER'
  )
  AND type = 'TEACHER_CREATED'
);

-- Teachers can update assignments they created
CREATE POLICY "Teachers can update their assignments"
ON assignments FOR UPDATE
USING (
  teacher_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'TEACHER'
  )
); 