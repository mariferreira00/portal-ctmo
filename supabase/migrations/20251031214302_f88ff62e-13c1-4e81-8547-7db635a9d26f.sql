-- Add is_free column to classes table
ALTER TABLE public.classes
ADD COLUMN is_free boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.classes.is_free IS 'Indica se a turma é livre (sem cobrança adicional, permitindo múltiplas matrículas)';

-- Create enrollment_requests table for additional enrollment requests
CREATE TABLE public.enrollment_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamp with time zone,
  UNIQUE(student_id, class_id)
);

-- Enable RLS
ALTER TABLE public.enrollment_requests ENABLE ROW LEVEL SECURITY;

-- Students can create their own requests
CREATE POLICY "Students can create their own enrollment requests"
ON public.enrollment_requests
FOR INSERT
WITH CHECK (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
);

-- Students can view their own requests
CREATE POLICY "Students can view their own enrollment requests"
ON public.enrollment_requests
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
);

-- Admins can manage all requests
CREATE POLICY "Admins can manage all enrollment requests"
ON public.enrollment_requests
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_enrollment_requests_updated_at
BEFORE UPDATE ON public.enrollment_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();