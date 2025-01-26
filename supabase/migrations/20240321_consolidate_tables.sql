-- Drop submissions table and related objects
DROP TABLE IF EXISTS submissions CASCADE;

-- Update assignments table with submission fields
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS feedback JSONB,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- Drop existing status check constraint if it exists
ALTER TABLE assignments 
DROP CONSTRAINT IF EXISTS assignments_status_check;

-- Add new status check constraint
ALTER TABLE assignments
ADD CONSTRAINT assignments_status_check 
CHECK (status IN ('DRAFT', 'SUBMITTED', 'VERIFIED', 'NEEDS_REVISION')); 