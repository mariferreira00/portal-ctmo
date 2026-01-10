-- Fix infinite recursion on students RLS: policy self-references students table
DROP POLICY IF EXISTS "Users can view classmates who posted in feed" ON public.students;