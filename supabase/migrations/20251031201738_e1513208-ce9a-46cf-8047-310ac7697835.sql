-- Remove the problematic policy
DROP POLICY IF EXISTS "Students can view classmates basic info" ON public.students;

-- Create a better policy that only allows viewing classmates in the SAME classes
-- This won't interfere with the user's ability to see their own profile
CREATE POLICY "Students can view classmates for social features"
ON public.students
FOR SELECT
USING (
  -- Allow viewing if user is in at least one common class
  id IN (
    SELECT DISTINCT ce2.student_id
    FROM class_enrollments ce1
    JOIN students s ON ce1.student_id = s.id
    JOIN class_enrollments ce2 ON ce1.class_id = ce2.class_id
    WHERE s.user_id = auth.uid()
      AND ce2.student_id != s.id  -- Don't duplicate own profile access
  )
);