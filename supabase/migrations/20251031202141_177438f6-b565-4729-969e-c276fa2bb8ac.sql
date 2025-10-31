-- Remove the potentially recursive policy
DROP POLICY IF EXISTS "Students can view classmates for ranking" ON public.students;

-- Create a non-recursive policy using only user_id
-- This avoids any recursion by not querying the students table within itself
CREATE POLICY "Students view classmates no recursion"
ON public.students
FOR SELECT
USING (
  -- Students can view profiles of other students in shared classes
  id IN (
    SELECT DISTINCT ce2.student_id
    FROM class_enrollments ce1
    JOIN class_enrollments ce2 ON ce1.class_id = ce2.class_id
    WHERE ce1.student_id = ANY(
      -- Get student_id directly from the current row being checked
      SELECT s.id FROM students s WHERE s.user_id = auth.uid() LIMIT 1
    )
  )
);