-- Remove the recursive policy
DROP POLICY IF EXISTS "Students view classmates no recursion" ON public.students;

-- Create a helper function that bypasses RLS to get student_id from user_id
CREATE OR REPLACE FUNCTION public.get_student_id_from_user(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM students WHERE user_id = p_user_id LIMIT 1;
$$;

-- Now create the policy using the helper function
CREATE POLICY "Students can view classmates safely"
ON public.students
FOR SELECT
USING (
  -- Students can view other students who share classes with them
  id IN (
    SELECT DISTINCT ce2.student_id
    FROM class_enrollments ce1
    JOIN class_enrollments ce2 ON ce1.class_id = ce2.class_id
    WHERE ce1.student_id = public.get_student_id_from_user(auth.uid())
  )
);