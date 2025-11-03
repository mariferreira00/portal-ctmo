-- Create subclasses table
CREATE TABLE public.subclasses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  schedule TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on subclasses
ALTER TABLE public.subclasses ENABLE ROW LEVEL SECURITY;

-- Policies for subclasses
CREATE POLICY "Students can view subclasses where enrolled or active"
ON public.subclasses
FOR SELECT
USING (
  (active = true) AND (
    has_role(auth.uid(), 'user'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'instructor'::app_role)
  )
);

CREATE POLICY "Admins have full access to all subclasses"
ON public.subclasses
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Instructors can manage subclasses in their classes"
ON public.subclasses
FOR ALL
USING (
  has_role(auth.uid(), 'instructor'::app_role) AND
  class_id IN (
    SELECT c.id FROM classes c
    JOIN teachers t ON c.teacher_id = t.id
    WHERE t.user_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'instructor'::app_role) AND
  class_id IN (
    SELECT c.id FROM classes c
    JOIN teachers t ON c.teacher_id = t.id
    WHERE t.user_id = auth.uid()
  )
);

-- Add subclass_id to attendance table
ALTER TABLE public.attendance 
ADD COLUMN subclass_id UUID REFERENCES public.subclasses(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_subclasses_class_id ON public.subclasses(class_id);
CREATE INDEX idx_attendance_subclass_id ON public.attendance(subclass_id);

-- Add trigger for updated_at
CREATE TRIGGER update_subclasses_updated_at
BEFORE UPDATE ON public.subclasses
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();