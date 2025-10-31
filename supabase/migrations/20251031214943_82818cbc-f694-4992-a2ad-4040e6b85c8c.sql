-- Allow instructors to view training posts from their students
CREATE POLICY "Instructors can view posts from their students"
ON public.training_posts
FOR SELECT
USING (
  has_role(auth.uid(), 'instructor'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM students s
    JOIN class_enrollments ce ON s.id = ce.student_id
    JOIN classes c ON ce.class_id = c.id
    JOIN teachers t ON c.teacher_id = t.id
    WHERE training_posts.student_id = s.id
      AND t.user_id = auth.uid()
  )
);

-- Allow instructors to add comments on posts from their students
CREATE POLICY "Instructors can comment on their students posts"
ON public.post_comments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM training_posts tp
    JOIN students s ON tp.student_id = s.id
    JOIN class_enrollments ce ON s.id = ce.student_id
    JOIN classes c ON ce.class_id = c.id
    JOIN teachers t ON c.teacher_id = t.id
    WHERE tp.id = post_comments.post_id
      AND t.user_id = auth.uid()
      AND has_role(auth.uid(), 'instructor'::app_role)
  )
);

-- Allow instructors to add reactions on posts from their students
CREATE POLICY "Instructors can react to their students posts"
ON public.post_reactions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM training_posts tp
    JOIN students s ON tp.student_id = s.id
    JOIN class_enrollments ce ON s.id = ce.student_id
    JOIN classes c ON ce.class_id = c.id
    JOIN teachers t ON c.teacher_id = t.id
    WHERE tp.id = post_reactions.post_id
      AND t.user_id = auth.uid()
      AND has_role(auth.uid(), 'instructor'::app_role)
  )
);

-- Allow instructors to delete their own reactions
CREATE POLICY "Instructors can delete their own reactions"
ON public.post_reactions
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM teachers
    WHERE teachers.user_id = auth.uid()
      AND has_role(auth.uid(), 'instructor'::app_role)
  )
);

-- Allow instructors to update their own reactions
CREATE POLICY "Instructors can update their own reactions"
ON public.post_reactions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM teachers
    WHERE teachers.user_id = auth.uid()
      AND has_role(auth.uid(), 'instructor'::app_role)
  )
);

-- Create instructor_student_id lookup table for efficient querying
-- This helps avoid complex joins in the application
CREATE TABLE IF NOT EXISTS public.instructor_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.instructor_profile ENABLE ROW LEVEL SECURITY;

-- Instructors can view their own profile
CREATE POLICY "Instructors can view their own profile"
ON public.instructor_profile
FOR SELECT
USING (user_id = auth.uid());

-- Admins can manage all instructor profiles
CREATE POLICY "Admins can manage instructor profiles"
ON public.instructor_profile
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));