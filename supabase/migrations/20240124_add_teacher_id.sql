ALTER TABLE assignments
ADD COLUMN teacher_id UUID REFERENCES profiles(id);

-- Add index for performance
CREATE INDEX idx_assignments_teacher_id ON assignments(teacher_id); 