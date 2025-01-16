-- Add new columns to assignments table
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
ADD COLUMN IF NOT EXISTS verified_at timestamptz,
ADD COLUMN IF NOT EXISTS feedback jsonb,
ADD COLUMN IF NOT EXISTS revision_history jsonb[] DEFAULT ARRAY[]::jsonb[],
ADD COLUMN IF NOT EXISTS current_revision integer DEFAULT 0;

-- Drop submissions table
DROP TABLE submissions; 