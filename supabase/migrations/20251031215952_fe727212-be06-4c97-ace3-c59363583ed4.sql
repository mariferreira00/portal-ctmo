-- Add teacher_id to post_reactions table
ALTER TABLE post_reactions
ADD COLUMN teacher_id uuid REFERENCES teachers(id);

-- Add constraint to ensure either student_id or teacher_id is set (but not both)
ALTER TABLE post_reactions
DROP CONSTRAINT IF EXISTS post_reactions_student_id_fkey;

ALTER TABLE post_reactions
ALTER COLUMN student_id DROP NOT NULL;

ALTER TABLE post_reactions
ADD CONSTRAINT post_reactions_author_check 
CHECK (
  (student_id IS NOT NULL AND teacher_id IS NULL) OR
  (student_id IS NULL AND teacher_id IS NOT NULL)
);

-- Update RLS policies for instructors to manage their own reactions
DROP POLICY IF EXISTS "Instructors can delete their own reactions" ON post_reactions;
DROP POLICY IF EXISTS "Instructors can react to their students posts" ON post_reactions;
DROP POLICY IF EXISTS "Instructors can update their own reactions" ON post_reactions;

CREATE POLICY "Instructors can create reactions"
ON post_reactions
FOR INSERT
TO authenticated
WITH CHECK (
  teacher_id IN (
    SELECT id FROM teachers WHERE user_id = auth.uid()
  )
  AND has_role(auth.uid(), 'instructor'::app_role)
);

CREATE POLICY "Instructors can update their own reactions"
ON post_reactions
FOR UPDATE
TO authenticated
USING (
  teacher_id IN (
    SELECT id FROM teachers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Instructors can delete their own reactions"
ON post_reactions
FOR DELETE
TO authenticated
USING (
  teacher_id IN (
    SELECT id FROM teachers WHERE user_id = auth.uid()
  )
);