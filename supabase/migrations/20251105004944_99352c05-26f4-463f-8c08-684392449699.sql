-- Corrigir search_path da função trigger
CREATE OR REPLACE FUNCTION protect_student_financial_fields()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;