-- Create announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Admins can manage all announcements
CREATE POLICY "Admins can manage all announcements"
ON public.announcements
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Instructors can manage announcements for their classes
CREATE POLICY "Instructors can manage their class announcements"
ON public.announcements
FOR ALL
USING (
  has_role(auth.uid(), 'instructor'::app_role)
  AND class_id IN (
    SELECT c.id
    FROM classes c
    JOIN teachers t ON c.teacher_id = t.id
    WHERE t.user_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'instructor'::app_role)
  AND class_id IN (
    SELECT c.id
    FROM classes c
    JOIN teachers t ON c.teacher_id = t.id
    WHERE t.user_id = auth.uid()
  )
);

-- Students can view system announcements or announcements from their enrolled classes
CREATE POLICY "Students can view relevant announcements"
ON public.announcements
FOR SELECT
USING (
  is_system = true
  OR class_id IN (
    SELECT ce.class_id
    FROM class_enrollments ce
    JOIN students s ON ce.student_id = s.id
    WHERE s.user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create index for better performance
CREATE INDEX idx_announcements_class_id ON public.announcements(class_id);
CREATE INDEX idx_announcements_is_system ON public.announcements(is_system);
CREATE INDEX idx_announcements_created_at ON public.announcements(created_at DESC);