-- Drop existing check constraint
ALTER TABLE submissions 
DROP CONSTRAINT IF EXISTS submissions_status_check;

-- Add new check constraint with updated status options
ALTER TABLE submissions
ADD CONSTRAINT submissions_status_check 
CHECK (status IN ('DRAFT', 'SUBMITTED', 'VERIFIED', 'NEEDS_REVISION', 'PUBLISHED')); 