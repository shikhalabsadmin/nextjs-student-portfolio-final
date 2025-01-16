-- Update existing assignments to get grade from student profile
UPDATE assignments a
SET grade = (
  SELECT CAST(SUBSTRING(p.grade FROM '^[0-9]+') AS INTEGER)
  FROM profiles p
  WHERE p.id = a.student_id
)
WHERE a.grade IS NULL; 