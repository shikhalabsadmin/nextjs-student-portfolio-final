-- First check assignments table structure
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'assignments'
ORDER BY ordinal_position;

-- Also check existing constraints
SELECT
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON cc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'assignments'; 

-- Add NEEDS_REVISION to status options
ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_status_check;
ALTER TABLE assignments ADD CONSTRAINT assignments_status_check 
    CHECK (status IN ('DRAFT', 'SUBMITTED', 'VERIFIED', 'NEEDS_REVISION'));

-- Document column purposes
COMMENT ON COLUMN assignments.selected_skills IS 'Skills selected by the student that they believe they practiced';
COMMENT ON COLUMN assignments.skills_justification IS 'Student''s justification for why they selected these skills';

-- Document feedback JSONB structure for teacher verification
COMMENT ON COLUMN assignments.feedback IS 'Stores teacher verification data as JSONB: {
  "verified_skills": string[],  -- Skills the teacher confirms were demonstrated
  "skills_verification": string,  -- Teacher''s justification of how skills were demonstrated
  "remarks": string  -- General feedback and remarks for the assignment
}';

-- Drop unnecessary tables
DROP TABLE IF EXISTS teacher_assessments CASCADE;
DROP TABLE IF EXISTS verifications CASCADE;
DROP TABLE IF EXISTS responses CASCADE; 