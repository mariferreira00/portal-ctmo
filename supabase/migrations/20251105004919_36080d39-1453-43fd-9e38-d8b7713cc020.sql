-- Remover política problemática e criar uma simples sem recursão
DROP POLICY IF EXISTS "Users can update their own student record" ON students;

-- Criar política simples para permitir update próprio
CREATE POLICY "Users can update their own student record"
ON students
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Criar função trigger para proteger campos financeiros
CREATE OR REPLACE FUNCTION protect_student_financial_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevenir alteração de campos financeiros por usuários comuns
  IF OLD.payment_due_day IS DISTINCT FROM NEW.payment_due_day 
     AND NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar o dia de vencimento';
  END IF;
  
  IF OLD.monthly_fee IS DISTINCT FROM NEW.monthly_fee 
     AND NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar a mensalidade';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger
DROP TRIGGER IF EXISTS protect_financial_fields ON students;
CREATE TRIGGER protect_financial_fields
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION protect_student_financial_fields();