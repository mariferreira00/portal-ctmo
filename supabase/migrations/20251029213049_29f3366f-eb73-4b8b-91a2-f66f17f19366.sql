-- Adicionar política RLS para permitir instrutores verem dados completos dos alunos em suas turmas
CREATE POLICY "Instructors can view students in their classes"
ON public.students
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'instructor'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM public.class_enrollments ce
    JOIN public.classes c ON c.id = ce.class_id
    JOIN public.teachers t ON t.id = c.teacher_id
    WHERE ce.student_id = students.id
      AND t.user_id = auth.uid()
  )
);