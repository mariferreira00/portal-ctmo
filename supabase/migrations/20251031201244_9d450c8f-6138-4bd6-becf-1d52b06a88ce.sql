-- Allow students to view basic info of classmates for ranking and social features
CREATE POLICY "Students can view classmates basic info"
ON public.students
FOR SELECT
USING (
  -- Students can see basic info of classmates in same classes
  EXISTS (
    SELECT 1
    FROM class_enrollments ce1
    JOIN class_enrollments ce2 ON ce1.class_id = ce2.class_id
    JOIN students s ON ce1.student_id = s.id
    WHERE s.user_id = auth.uid()
      AND ce2.student_id = students.id
  )
);