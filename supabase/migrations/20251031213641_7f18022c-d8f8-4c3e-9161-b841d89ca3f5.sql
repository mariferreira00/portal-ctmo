-- Add weekly_goal column to students table
ALTER TABLE public.students
ADD COLUMN weekly_goal integer NOT NULL DEFAULT 3;

COMMENT ON COLUMN public.students.weekly_goal IS 'Meta semanal de treinos definida pelo aluno';