-- Create helper function to check if user is instructor of a class (avoids policy recursion)
CREATE OR REPLACE FUNCTION public.is_instructor_of_class(p_user_id uuid, p_class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM classes c
    JOIN teachers t ON c.teacher_id = t.id
    WHERE c.id = p_class_id
    AND t.user_id = p_user_id
  );
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Instructors can manage enrollments in their classes" ON class_enrollments;

-- Recreate with simpler logic using the security definer function
CREATE POLICY "Instructors can manage enrollments in their classes"
ON class_enrollments
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'instructor'::app_role) 
  AND is_instructor_of_class(auth.uid(), class_id)
)
WITH CHECK (
  has_role(auth.uid(), 'instructor'::app_role) 
  AND is_instructor_of_class(auth.uid(), class_id)
);