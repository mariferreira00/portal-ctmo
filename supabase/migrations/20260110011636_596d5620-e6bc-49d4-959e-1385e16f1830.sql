-- Remove the overly permissive policy that exposes student data
DROP POLICY IF EXISTS "Users can view basic info of students who posted in training fe" ON public.students;

-- Create a secure policy: users can only see students from training feed if they are classmates
CREATE POLICY "Users can view classmates who posted in feed" 
ON public.students 
FOR SELECT 
USING (
  -- Only allow viewing students who posted if the viewer is enrolled in the same class
  EXISTS (
    SELECT 1 FROM training_posts tp
    WHERE tp.student_id = students.id
  ) AND
  EXISTS (
    SELECT 1 
    FROM class_enrollments ce_viewer
    JOIN students viewer ON ce_viewer.student_id = viewer.id
    JOIN class_enrollments ce_student ON ce_viewer.class_id = ce_student.class_id
    WHERE viewer.user_id = auth.uid()
    AND ce_student.student_id = students.id
  )
);