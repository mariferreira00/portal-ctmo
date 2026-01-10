-- =====================================================
-- CORREÇÃO DA RECURSÃO EM class_enrollments
-- =====================================================

-- 1. Criar função para obter class_ids do aluno (evita recursão)
CREATE OR REPLACE FUNCTION public.get_student_class_ids(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ce.class_id 
  FROM class_enrollments ce 
  WHERE ce.student_id = get_student_id_from_user(p_user_id);
$$;

-- 2. Remover política problemática
DROP POLICY IF EXISTS "Students can view classmates enrollments" ON class_enrollments;

-- 3. Recriar política usando função SECURITY DEFINER
CREATE POLICY "Students can view classmates enrollments"
ON class_enrollments FOR SELECT
USING (
  class_id IN (SELECT get_student_class_ids(auth.uid()))
);