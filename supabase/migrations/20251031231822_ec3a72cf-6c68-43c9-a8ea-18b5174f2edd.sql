-- Add email column to instructor_requests table to store user email for notifications
ALTER TABLE public.instructor_requests 
ADD COLUMN email text;

-- Add index for better query performance
CREATE INDEX idx_instructor_requests_email ON public.instructor_requests(email);