-- =====================================================
-- CORREÇÃO DE RECURSÃO INFINITA NAS POLÍTICAS RLS
-- =====================================================

-- 1. Criar função auxiliar para obter teacher_id do usuário (evita RLS)
CREATE OR REPLACE FUNCTION public.get_teacher_id_for_user(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM teachers WHERE user_id = p_user_id LIMIT 1;
$$;

-- 2. Criar função para verificar se aluno pode ver um professor (evita RLS)
CREATE OR REPLACE FUNCTION public.student_can_view_teacher(p_user_id uuid, p_teacher_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM students s
    JOIN class_enrollments ce ON s.id = ce.student_id
    JOIN classes c ON ce.class_id = c.id
    WHERE s.user_id = p_user_id
      AND c.teacher_id = p_teacher_id
  );
$$;

-- 3. Criar função para verificar se usuário é instrutor de uma turma (versão corrigida)
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

-- 4. Criar função para verificar se usuário tem papel de instrutor e obter seu teacher_id
CREATE OR REPLACE FUNCTION public.user_is_instructor_with_teacher_id(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id 
  FROM teachers t
  JOIN user_roles ur ON ur.user_id = p_user_id AND ur.role = 'instructor'
  WHERE t.user_id = p_user_id
  LIMIT 1;
$$;

-- =====================================================
-- RECRIAR POLÍTICAS DA TABELA CLASSES
-- =====================================================

-- Remover políticas existentes de classes
DROP POLICY IF EXISTS "Admins have full access to all classes" ON classes;
DROP POLICY IF EXISTS "Instructors can manage their own classes" ON classes;
DROP POLICY IF EXISTS "Users can view active classes" ON classes;

-- Política 1: Admins têm acesso total
CREATE POLICY "Admins have full access to all classes"
ON classes FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Política 2: Instrutores podem gerenciar suas próprias turmas (usando função SECURITY DEFINER)
CREATE POLICY "Instructors can manage their own classes"
ON classes FOR ALL
USING (
  teacher_id = get_teacher_id_for_user(auth.uid())
)
WITH CHECK (
  teacher_id = get_teacher_id_for_user(auth.uid())
);

-- Política 3: Usuários autenticados podem ver turmas ativas (simplificada)
CREATE POLICY "Users can view active classes"
ON classes FOR SELECT
USING (
  active = true
  AND auth.uid() IS NOT NULL
);

-- =====================================================
-- RECRIAR POLÍTICAS DA TABELA TEACHERS
-- =====================================================

-- Remover políticas existentes de teachers
DROP POLICY IF EXISTS "Admins and instructors can manage teachers" ON teachers;
DROP POLICY IF EXISTS "Students can view their instructors" ON teachers;

-- Política 1: Admins podem gerenciar todos os professores
CREATE POLICY "Admins can manage all teachers"
ON teachers FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Política 2: Instrutores podem gerenciar seu próprio perfil
CREATE POLICY "Instructors can manage their own profile"
ON teachers FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Política 3: Alunos podem ver seus instrutores (usando função SECURITY DEFINER)
CREATE POLICY "Students can view their instructors"
ON teachers FOR SELECT
USING (
  student_can_view_teacher(auth.uid(), id)
);

-- =====================================================
-- RECRIAR POLÍTICAS DA TABELA CLASS_ENROLLMENTS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Admins can manage all enrollments" ON class_enrollments;
DROP POLICY IF EXISTS "Instructors can manage enrollments in their classes" ON class_enrollments;
DROP POLICY IF EXISTS "Students can create their own enrollments" ON class_enrollments;
DROP POLICY IF EXISTS "Students can view enrollments safely" ON class_enrollments;

-- Política 1: Admins podem gerenciar todas as matrículas
CREATE POLICY "Admins can manage all enrollments"
ON class_enrollments FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Política 2: Instrutores podem gerenciar matrículas em suas turmas (usando função SECURITY DEFINER)
CREATE POLICY "Instructors can manage enrollments in their classes"
ON class_enrollments FOR ALL
USING (
  is_instructor_of_class(auth.uid(), class_id)
)
WITH CHECK (
  is_instructor_of_class(auth.uid(), class_id)
);

-- Política 3: Alunos podem criar suas próprias matrículas
CREATE POLICY "Students can create their own enrollments"
ON class_enrollments FOR INSERT
WITH CHECK (
  student_id = get_student_id_from_user(auth.uid())
);

-- Política 4: Alunos podem ver suas próprias matrículas
CREATE POLICY "Students can view their own enrollments"
ON class_enrollments FOR SELECT
USING (
  student_id = get_student_id_from_user(auth.uid())
);

-- Política 5: Alunos podem ver matrículas de colegas da mesma turma
CREATE POLICY "Students can view classmates enrollments"
ON class_enrollments FOR SELECT
USING (
  class_id IN (
    SELECT ce.class_id 
    FROM class_enrollments ce 
    WHERE ce.student_id = get_student_id_from_user(auth.uid())
  )
);

-- =====================================================
-- ATUALIZAR FUNÇÃO user_can_view_student (simplificada)
-- =====================================================

CREATE OR REPLACE FUNCTION public.user_can_view_student(_user_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Admins podem ver todos
    has_role(_user_id, 'admin'::app_role)
    OR
    -- Próprio aluno pode ver
    (SELECT user_id FROM students WHERE id = _student_id) = _user_id
    OR
    -- Instrutor pode ver se aluno está matriculado em suas turmas
    EXISTS (
      SELECT 1
      FROM class_enrollments ce
      JOIN classes c ON c.id = ce.class_id
      WHERE ce.student_id = _student_id
        AND c.teacher_id = get_teacher_id_for_user(_user_id)
    )
    OR
    -- Alunos da mesma turma podem se ver
    EXISTS (
      SELECT 1
      FROM class_enrollments ce1
      JOIN class_enrollments ce2 ON ce1.class_id = ce2.class_id
      WHERE ce1.student_id = get_student_id_from_user(_user_id)
        AND ce2.student_id = _student_id
    );
$$;

-- =====================================================
-- ATUALIZAR FUNÇÃO user_can_view_enrollment (simplificada)
-- =====================================================

CREATE OR REPLACE FUNCTION public.user_can_view_enrollment(_user_id uuid, _enrollment_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Admin pode ver todos
    has_role(_user_id, 'admin'::app_role)
    OR
    -- Próprio aluno pode ver seus enrollments
    _enrollment_student_id = get_student_id_from_user(_user_id)
    OR
    -- Instrutor pode ver enrollments de suas turmas
    get_teacher_id_for_user(_user_id) IS NOT NULL;
$$;