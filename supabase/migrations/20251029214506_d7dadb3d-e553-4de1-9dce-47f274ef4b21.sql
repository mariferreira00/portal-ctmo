-- Remover a política problemática que causa recursão infinita
DROP POLICY IF EXISTS "Instructors can view students in their classes" ON public.students;

-- Recriar a política usando a função existente can_view_student que já está definida
CREATE POLICY "Instructors can view students in their classes"
ON public.students
FOR SELECT
TO authenticated
USING (
  public.can_view_student(auth.uid(), students.id)
);