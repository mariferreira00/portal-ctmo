-- Fix Critical Security Issues in Portal CTMO

-- ============================================
-- 1. FIX ACHIEVEMENT MANIPULATION VULNERABILITY
-- ============================================
-- Remove overly permissive policies that allow any user to create/update achievements

DROP POLICY IF EXISTS "System can create user achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "System can update user achievements" ON public.user_achievements;

-- Add admin-only policy for manual achievement management
CREATE POLICY "Admins can manage user achievements"
ON public.user_achievements
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- The trigger_check_achievements function with SECURITY DEFINER will still work
-- because it bypasses RLS policies when executing


-- ============================================
-- 2. FIX PROFILE ENUMERATION ISSUE
-- ============================================
-- Replace overly permissive "Users can view all profiles" policy

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow instructors to view profiles of students in their classes
CREATE POLICY "Instructors view student profiles"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'instructor'::app_role)
  AND EXISTS (
    SELECT 1 
    FROM students s
    JOIN class_enrollments ce ON s.id = ce.student_id
    JOIN classes c ON ce.class_id = c.id
    JOIN teachers t ON c.teacher_id = t.id
    WHERE t.user_id = auth.uid()
      AND s.user_id = profiles.id
  )
);

-- Allow students to view profiles of their instructors
CREATE POLICY "Students view instructor profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM students s
    JOIN class_enrollments ce ON s.id = ce.student_id
    JOIN classes c ON ce.class_id = c.id
    JOIN teachers t ON c.teacher_id = t.id
    WHERE s.user_id = auth.uid()
      AND t.user_id = profiles.id
  )
);

-- Allow students to view profiles of classmates
CREATE POLICY "Students view classmate profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM students s1
    JOIN class_enrollments ce1 ON s1.id = ce1.student_id
    JOIN class_enrollments ce2 ON ce1.class_id = ce2.class_id
    JOIN students s2 ON ce2.student_id = s2.id
    WHERE s1.user_id = auth.uid()
      AND s2.user_id = profiles.id
  )
);


-- ============================================
-- 3. ADD INPUT VALIDATION CONSTRAINTS
-- ============================================

-- Validate email format for students
ALTER TABLE public.students
ADD CONSTRAINT valid_student_email 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Validate phone format for students (at least 10 digits if provided)
ALTER TABLE public.students
ADD CONSTRAINT valid_student_phone 
CHECK (phone IS NULL OR length(regexp_replace(phone, '[^0-9]', '', 'g')) >= 10);

-- Validate payment due day (1-31)
ALTER TABLE public.students
ADD CONSTRAINT valid_payment_day 
CHECK (payment_due_day IS NULL OR (payment_due_day >= 1 AND payment_due_day <= 31));

-- Validate emergency phone format
ALTER TABLE public.students
ADD CONSTRAINT valid_emergency_phone 
CHECK (emergency_phone IS NULL OR length(regexp_replace(emergency_phone, '[^0-9]', '', 'g')) >= 10);

-- Validate email format for teachers
ALTER TABLE public.teachers
ADD CONSTRAINT valid_teacher_email 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Validate phone format for teachers
ALTER TABLE public.teachers
ADD CONSTRAINT valid_teacher_phone 
CHECK (phone IS NULL OR length(regexp_replace(phone, '[^0-9]', '', 'g')) >= 10);

-- Add length constraints to prevent abuse
ALTER TABLE public.students
ADD CONSTRAINT valid_full_name_length CHECK (length(full_name) >= 2 AND length(full_name) <= 200),
ADD CONSTRAINT valid_email_length CHECK (length(email) <= 255);

ALTER TABLE public.teachers
ADD CONSTRAINT valid_teacher_name_length CHECK (length(full_name) >= 2 AND length(full_name) <= 200),
ADD CONSTRAINT valid_teacher_email_length CHECK (length(email) <= 255);

ALTER TABLE public.classes
ADD CONSTRAINT valid_class_name_length CHECK (length(name) >= 2 AND length(name) <= 200),
ADD CONSTRAINT valid_schedule_length CHECK (length(schedule) >= 2 AND length(schedule) <= 500);