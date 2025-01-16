-- Create submissions table
CREATE TABLE submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES assignments(id),
  student_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  artifact_type TEXT NOT NULL,
  artifact_url TEXT,
  is_team_project BOOLEAN DEFAULT false,
  team_contribution TEXT,
  is_original_work BOOLEAN DEFAULT true,
  month TEXT NOT NULL,
  status TEXT DEFAULT 'DRAFT',
  grade TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add indexes for performance
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_student_id ON submissions(student_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_grade ON submissions(grade);

-- Add RLS policies
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Teachers can view submissions for their subjects and grades
CREATE POLICY "Teachers can view submissions for their subjects and grades" ON submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles teacher
      WHERE teacher.id = auth.uid()
      AND teacher.role = 'teacher'
      AND (
        -- Check if the submission's grade matches any of the teacher's teaching grades
        grade = ANY(teacher.teaching_grades)
        -- And the submission's subject matches any of the teacher's teaching subjects
        AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements(teacher.teaching_subjects) AS ts
          WHERE ts->>'subject' = subject
          AND ts->>'grade' = grade
        )
      )
    )
  );

-- Students can view their own submissions
CREATE POLICY "Students can view their own submissions" ON submissions
  FOR SELECT
  USING (student_id = auth.uid());

-- Students can insert their own submissions
CREATE POLICY "Students can insert their own submissions" ON submissions
  FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Students can update their own submissions
CREATE POLICY "Students can update their own submissions" ON submissions
  FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Students can delete their own draft submissions
CREATE POLICY "Students can delete their own draft submissions" ON submissions
  FOR DELETE
  USING (student_id = auth.uid() AND status = 'DRAFT');

-- Add trigger to update updated_at
CREATE TRIGGER set_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 