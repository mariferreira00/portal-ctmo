-- Create comments table
CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.training_posts(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  comment text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT comment_length CHECK (char_length(comment) <= 500)
);

-- Enable RLS
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments
CREATE POLICY "Anyone can view comments"
ON public.post_comments FOR SELECT
USING (true);

CREATE POLICY "Students can add comments"
ON public.post_comments FOR INSERT
WITH CHECK (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Students can delete their own comments"
ON public.post_comments FOR DELETE
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
  OR
  -- Post owner can delete comments on their posts
  post_id IN (
    SELECT id FROM training_posts 
    WHERE student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  )
);

-- Create index for better performance
CREATE INDEX idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX idx_post_comments_created_at ON public.post_comments(created_at DESC);

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;