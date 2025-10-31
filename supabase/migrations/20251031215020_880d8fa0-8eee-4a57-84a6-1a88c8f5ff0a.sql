-- Modify post_comments to support both students and teachers
ALTER TABLE public.post_comments
ALTER COLUMN student_id DROP NOT NULL;

-- Add teacher_id column
ALTER TABLE public.post_comments
ADD COLUMN teacher_id uuid REFERENCES public.teachers(id) ON DELETE CASCADE;

-- Add constraint to ensure either student_id or teacher_id is set
ALTER TABLE public.post_comments
ADD CONSTRAINT post_comments_author_check CHECK (
  (student_id IS NOT NULL AND teacher_id IS NULL) OR
  (student_id IS NULL AND teacher_id IS NOT NULL)
);

-- Allow instructors to delete their own comments
CREATE POLICY "Instructors can delete their own comments"
ON public.post_comments
FOR DELETE
USING (
  teacher_id IN (
    SELECT id FROM public.teachers WHERE user_id = auth.uid()
  )
);