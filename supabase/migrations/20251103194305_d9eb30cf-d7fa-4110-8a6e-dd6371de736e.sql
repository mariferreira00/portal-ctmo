-- Make user_id NOT NULL in students table (required for RLS)
ALTER TABLE public.students ALTER COLUMN user_id SET NOT NULL;