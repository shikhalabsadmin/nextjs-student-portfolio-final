-- Drop the existing delete policy
DROP POLICY IF EXISTS "Students can delete their own draft assignments" ON assignments;

-- Recreate the policy with case-insensitive status check
CREATE POLICY "Students can delete their own draft assignments"
ON assignments FOR DELETE
USING (student_id = auth.uid() AND UPPER(status) = 'DRAFT'); 