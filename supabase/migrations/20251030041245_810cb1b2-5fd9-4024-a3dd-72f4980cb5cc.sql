-- Fix RLS policy for training_posts to correctly check student ownership
DROP POLICY IF EXISTS "Students can view posts from their classes and own posts" ON public.training_posts;

CREATE POLICY "Students can view posts from their classes and own posts"
ON public.training_posts
FOR SELECT
USING (
  -- Own posts: check if the post belongs to a student linked to the current user
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
  OR
  -- Classmates' posts: check if they share any class
  EXISTS (
    SELECT 1 FROM class_enrollments ce1
    INNER JOIN class_enrollments ce2 ON ce1.class_id = ce2.class_id
    WHERE ce1.student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    AND ce2.student_id = training_posts.student_id
  )
);

-- Update existing posts to set class_id from the student's first enrollment
UPDATE training_posts tp
SET class_id = (
  SELECT ce.class_id 
  FROM class_enrollments ce 
  WHERE ce.student_id = tp.student_id 
  LIMIT 1
)
WHERE class_id IS NULL;