-- First, let's see what assignments still have null grades
DO $$
DECLARE
    null_assignments RECORD;
BEGIN
    FOR null_assignments IN (
        SELECT a.id, a.student_id, a.teacher_id, p.grade as student_grade
        FROM assignments a
        LEFT JOIN profiles p ON p.id = a.student_id
        WHERE a.grade IS NULL
    ) LOOP
        RAISE NOTICE 'Assignment ID: %, Student ID: %, Teacher ID: %, Student Grade: %',
            null_assignments.id,
            null_assignments.student_id,
            null_assignments.teacher_id,
            null_assignments.student_grade;
    END LOOP;
END $$;

-- Update assignments with student grades where possible
UPDATE assignments a
SET grade = (
  SELECT CAST(SUBSTRING(p.grade FROM '^[0-9]+') AS INTEGER)
  FROM profiles p
  WHERE p.id = a.student_id
)
WHERE a.grade IS NULL 
  AND a.student_id IS NOT NULL;

-- For assignments without student grades or student_id (like teacher-created assignments),
-- set a default grade of 1 (we can update these manually later)
UPDATE assignments
SET grade = 1
WHERE grade IS NULL;

-- Set a default subject if any are null
UPDATE assignments
SET subject = 'other'
WHERE subject IS NULL;

-- Now make both columns required
ALTER TABLE assignments 
ALTER COLUMN grade SET NOT NULL,
ALTER COLUMN subject SET NOT NULL; 