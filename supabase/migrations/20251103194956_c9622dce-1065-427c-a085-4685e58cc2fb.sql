-- Remover política antiga de INSERT que pode estar restritiva
DROP POLICY IF EXISTS "Users can create their own student record" ON public.students;

-- Criar nova política permitindo que usuários autenticados criem seus próprios registros
CREATE POLICY "Usuários podem criar seu próprio perfil de aluno"
ON public.students
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());