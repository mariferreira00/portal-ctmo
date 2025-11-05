-- Corrigir política RLS para permitir que alunos atualizem sua meta semanal
-- Drop da política antiga
DROP POLICY IF EXISTS "Users can update their own student record" ON students;

-- Criar nova política que permite atualizar apenas campos seguros
CREATE POLICY "Users can update their own student record"
ON students
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() 
  -- Garantir que campos críticos não sejam alterados
  AND payment_due_day IS NOT DISTINCT FROM (SELECT payment_due_day FROM students WHERE id = students.id)
  AND monthly_fee = (SELECT monthly_fee FROM students WHERE id = students.id)
);