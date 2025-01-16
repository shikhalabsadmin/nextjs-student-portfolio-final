-- First, add any missing columns
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS team_contribution TEXT,
ADD COLUMN IF NOT EXISTS originality_explanation TEXT,
ADD COLUMN IF NOT EXISTS selected_skills TEXT[],
ADD COLUMN IF NOT EXISTS skills_justification TEXT,
ADD COLUMN IF NOT EXISTS pride_reason TEXT,
ADD COLUMN IF NOT EXISTS creation_process TEXT,
ADD COLUMN IF NOT EXISTS learnings TEXT,
ADD COLUMN IF NOT EXISTS challenges TEXT,
ADD COLUMN IF NOT EXISTS improvements TEXT,
ADD COLUMN IF NOT EXISTS acknowledgments TEXT;

-- Move data from template_data to new columns if it exists
UPDATE assignments
SET
  team_contribution = (template_data->>'team_contribution')::TEXT,
  originality_explanation = (template_data->>'originality_explanation')::TEXT,
  selected_skills = ARRAY(SELECT jsonb_array_elements_text(template_data->'skills')),
  skills_justification = (template_data->>'skills_justification')::TEXT,
  pride_reason = (template_data->>'pride_reason')::TEXT,
  creation_process = (template_data->>'creation_process')::TEXT,
  learnings = (template_data->>'learnings')::TEXT,
  challenges = (template_data->>'challenges')::TEXT,
  improvements = (template_data->>'improvements')::TEXT,
  acknowledgments = (template_data->>'acknowledgments')::TEXT
WHERE template_data IS NOT NULL;

-- Drop columns we don't need anymore
ALTER TABLE assignments
DROP COLUMN IF EXISTS template_data,
DROP COLUMN IF EXISTS display_layout,
DROP COLUMN IF EXISTS group_id,
DROP COLUMN IF EXISTS description,
DROP COLUMN IF EXISTS grade; 