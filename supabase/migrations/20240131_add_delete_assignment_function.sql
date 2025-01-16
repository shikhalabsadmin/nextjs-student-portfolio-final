-- Create a function to safely delete assignments
CREATE OR REPLACE FUNCTION delete_assignment(
  assignment_id UUID,
  user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assignment assignments;
BEGIN
  -- Get the assignment and verify ownership
  SELECT * INTO v_assignment
  FROM assignments
  WHERE id = assignment_id
  AND student_id = user_id;

  -- If assignment not found or doesn't belong to user, return false
  IF v_assignment.id IS NULL THEN
    RETURN false;
  END IF;

  -- Delete the assignment
  DELETE FROM assignments
  WHERE id = assignment_id
  AND student_id = user_id;

  -- Return true if we got here
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error (in a real system, you'd want proper error logging)
    RAISE NOTICE 'Error deleting assignment: %', SQLERRM;
    RETURN false;
END;
$$; 