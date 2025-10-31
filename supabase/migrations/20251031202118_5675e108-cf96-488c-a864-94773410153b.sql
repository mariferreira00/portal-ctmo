-- Remove the policy causing infinite recursion
DROP POLICY IF EXISTS "Students can view classmates for social features" ON public.students;

-- Create a simpler policy without recursion
-- Students can see other students who are in at least one of their classes
CREATE POLICY "Students can view classmates for ranking"
ON public.students
FOR SELECT
USING (
  -- Allow viewing students who share at least one class
  EXISTS (
    SELECT 1
    FROM class_enrollments ce1
    JOIN class_enrollments ce2 ON ce1.class_id = ce2.class_id
    WHERE ce1.student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
    AND ce2.student_id = students.id
  )
);