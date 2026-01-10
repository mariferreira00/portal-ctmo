-- Fix 1: Remove policies that expose teacher contact info to everyone
DROP POLICY IF EXISTS "All authenticated users can view teachers" ON public.teachers;
DROP POLICY IF EXISTS "Authenticated users can view teachers" ON public.teachers;

-- Create a secure policy: only enrolled students can view their instructors
CREATE POLICY "Students can view their instructors" 
ON public.teachers 
FOR SELECT 
USING (
  -- Admins and instructors already have access via "Admins and instructors can manage teachers"
  -- Students can only see teachers who teach classes they're enrolled in
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'instructor') OR
  (
    has_role(auth.uid(), 'user') AND
    id IN (
      SELECT c.teacher_id 
      FROM classes c
      JOIN class_enrollments ce ON c.id = ce.class_id
      JOIN students s ON ce.student_id = s.id
      WHERE s.user_id = auth.uid()
    )
  )
);

-- Fix 2: Remove policy that exposes all comments to everyone
DROP POLICY IF EXISTS "Anyone can view comments" ON public.post_comments;

-- Create a secure policy: only relevant users can view comments
CREATE POLICY "Users can view relevant comments" 
ON public.post_comments 
FOR SELECT 
USING (
  -- Admins can see all comments
  has_role(auth.uid(), 'admin') OR
  -- The post owner can see comments on their posts
  post_id IN (
    SELECT tp.id FROM training_posts tp
    JOIN students s ON tp.student_id = s.id
    WHERE s.user_id = auth.uid()
  ) OR
  -- Students enrolled in the same class as the post owner can see comments
  post_id IN (
    SELECT tp.id FROM training_posts tp
    JOIN students post_owner ON tp.student_id = post_owner.id
    JOIN class_enrollments ce_owner ON post_owner.id = ce_owner.student_id
    JOIN class_enrollments ce_viewer ON ce_owner.class_id = ce_viewer.class_id
    JOIN students viewer ON ce_viewer.student_id = viewer.id
    WHERE viewer.user_id = auth.uid()
  ) OR
  -- Instructors can see comments on posts from their students
  (
    has_role(auth.uid(), 'instructor') AND
    post_id IN (
      SELECT tp.id FROM training_posts tp
      JOIN students s ON tp.student_id = s.id
      JOIN class_enrollments ce ON s.id = ce.student_id
      JOIN classes c ON ce.class_id = c.id
      JOIN teachers t ON c.teacher_id = t.id
      WHERE t.user_id = auth.uid()
    )
  )
);