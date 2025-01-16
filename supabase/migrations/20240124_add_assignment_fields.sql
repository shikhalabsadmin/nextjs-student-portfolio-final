-- Add description and due_date columns to assignments table
ALTER TABLE assignments
ADD COLUMN description TEXT,
ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;

-- Add indexes for performance
CREATE INDEX idx_assignments_due_date ON assignments(due_date); 