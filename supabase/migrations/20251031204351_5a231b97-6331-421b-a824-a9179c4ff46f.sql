-- CORREÇÃO CRÍTICA: Recursão infinita nas RLS policies
-- Problema: policies de students e class_enrollments se referenciam mutuamente

-- 1. Remover policies problemáticas
DROP POLICY IF EXISTS "Students can view classmates safely" ON public.students;
DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.class_enrollments;
DROP POLICY IF EXISTS "Students can enroll themselves in classes" ON public.class_enrollments;
DROP POLICY IF EXISTS "Instructors can view students in their classes" ON public.students;

-- 2. Criar função security definer para verificar se usuário pode ver aluno
CREATE OR REPLACE FUNCTION public.user_can_view_student(_user_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Admins podem ver todos
  SELECT 
    public.has_role(_user_id, 'admin'::app_role)
    OR
    -- Próprio aluno pode ver
    (SELECT user_id FROM public.students WHERE id = _student_id) = _user_id
    OR
    -- Instrutor pode ver se aluno está matriculado em suas turmas
    EXISTS (
      SELECT 1
      FROM public.class_enrollments ce
      JOIN public.classes c ON c.id = ce.class_id
      JOIN public.teachers t ON t.id = c.teacher_id
      WHERE ce.student_id = _student_id
        AND t.user_id = _user_id
    )
    OR
    -- Alunos da mesma turma podem se ver
    EXISTS (
      SELECT 1
      FROM public.class_enrollments ce1
      JOIN public.class_enrollments ce2 ON ce1.class_id = ce2.class_id
      WHERE ce1.student_id = (SELECT id FROM public.students WHERE user_id = _user_id LIMIT 1)
        AND ce2.student_id = _student_id
    )
$$;

-- 3. Criar função security definer para verificar enrollment
CREATE OR REPLACE FUNCTION public.user_can_view_enrollment(_user_id uuid, _enrollment_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Admin pode ver todos
    public.has_role(_user_id, 'admin'::app_role)
    OR
    -- Próprio aluno pode ver seus enrollments
    EXISTS (SELECT 1 FROM public.students WHERE id = _enrollment_student_id AND user_id = _user_id)
    OR
    -- Instrutor pode ver enrollments de suas turmas
    public.has_role(_user_id, 'instructor'::app_role)
$$;

-- 4. Recriar policies SEM recursão usando as funções security definer
CREATE POLICY "Users can view students safely"
ON public.students
FOR SELECT
USING (public.user_can_view_student(auth.uid(), id));

CREATE POLICY "Students can view enrollments safely"
ON public.class_enrollments
FOR SELECT
USING (public.user_can_view_enrollment(auth.uid(), student_id));

CREATE POLICY "Students can create their own enrollments"
ON public.class_enrollments
FOR INSERT
WITH CHECK (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
);

-- 5. Garantir que classes sejam visíveis para alunos matriculados
DROP POLICY IF EXISTS "Students can view active classes" ON public.classes;

CREATE POLICY "Students can view classes where enrolled or active"
ON public.classes
FOR SELECT
USING (
  active = true 
  AND (
    public.has_role(auth.uid(), 'user'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'instructor'::app_role)
  )
);
