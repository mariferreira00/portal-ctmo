-- Create instructor requests table
CREATE TABLE public.instructor_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamp with time zone,
  notes text,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.instructor_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view their own instructor requests"
ON public.instructor_requests
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can create their own requests
CREATE POLICY "Users can create their own instructor requests"
ON public.instructor_requests
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND status = 'pending');

-- Admins can view all requests
CREATE POLICY "Admins can view all instructor requests"
ON public.instructor_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update all requests
CREATE POLICY "Admins can update instructor requests"
ON public.instructor_requests
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to update updated_at
CREATE TRIGGER update_instructor_requests_updated_at
BEFORE UPDATE ON public.instructor_requests
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();