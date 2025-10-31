-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('reaction', 'comment')),
  post_id uuid NOT NULL REFERENCES public.training_posts(id) ON DELETE CASCADE,
  from_student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  reaction_type text,
  comment_text text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (
  student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  )
);

-- Create indexes
CREATE INDEX idx_notifications_student_id ON public.notifications(student_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to create notification on reaction
CREATE OR REPLACE FUNCTION notify_on_reaction()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id uuid;
BEGIN
  -- Get the post owner
  SELECT student_id INTO post_owner_id
  FROM training_posts
  WHERE id = NEW.post_id;
  
  -- Don't notify if reacting to own post
  IF post_owner_id != NEW.student_id THEN
    INSERT INTO notifications (student_id, type, post_id, from_student_id, reaction_type)
    VALUES (post_owner_id, 'reaction', NEW.post_id, NEW.student_id, NEW.reaction_type);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to create notification on comment
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id uuid;
BEGIN
  -- Get the post owner
  SELECT student_id INTO post_owner_id
  FROM training_posts
  WHERE id = NEW.post_id;
  
  -- Don't notify if commenting on own post
  IF post_owner_id != NEW.student_id THEN
    INSERT INTO notifications (student_id, type, post_id, from_student_id, comment_text)
    VALUES (post_owner_id, 'comment', NEW.post_id, NEW.student_id, LEFT(NEW.comment, 100));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
CREATE TRIGGER on_reaction_notify
AFTER INSERT ON post_reactions
FOR EACH ROW
EXECUTE FUNCTION notify_on_reaction();

CREATE TRIGGER on_comment_notify
AFTER INSERT ON post_comments
FOR EACH ROW
EXECUTE FUNCTION notify_on_comment();