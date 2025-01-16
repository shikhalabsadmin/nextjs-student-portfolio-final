-- First, alter the grade column to be text
ALTER TABLE assignments
ALTER COLUMN grade TYPE text;

-- Update all assignments with appropriate grades in a single statement
UPDATE assignments a
SET grade = CASE
  -- Case 1: When student_id exists, use student's grade
  WHEN a.student_id IS NOT NULL AND (
    SELECT p.grade FROM profiles p WHERE p.id = a.student_id
  ) IS NOT NULL 
  THEN (
    SELECT p.grade FROM profiles p WHERE p.id = a.student_id
  )
  
  -- Case 2: When teacher_id exists and has teaching grades, use first teaching grade
  WHEN a.teacher_id IS NOT NULL AND (
    SELECT teaching_grades[1]
    FROM profiles p
    WHERE p.id = a.teacher_id
    AND p.teaching_grades IS NOT NULL
    AND array_length(p.teaching_grades, 1) > 0
  ) IS NOT NULL
  THEN (
    SELECT teaching_grades[1]
    FROM profiles p
    WHERE p.id = a.teacher_id
    AND p.teaching_grades IS NOT NULL
    AND array_length(p.teaching_grades, 1) > 0
  )
  
  -- Case 3: Default to '5A' if no other grade can be determined
  ELSE '5A'
END
WHERE grade IS NULL OR grade ~ '^[0-9]+$'; 