-- Remove política que permite instrutores verem todas as turmas
DROP POLICY IF EXISTS "Students can view classes where enrolled or active" ON public.classes;

-- Cria política corrigida: apenas usuários comuns (não instrutores) podem ver turmas ativas
-- Instrutores já têm política própria que mostra apenas suas turmas
CREATE POLICY "Users can view active classes" 
ON public.classes 
FOR SELECT 
USING (
  (active = true) 
  AND (
    has_role(auth.uid(), 'user'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
  AND NOT has_role(auth.uid(), 'instructor'::app_role)
);