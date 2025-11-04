-- Adicionar política para permitir que usuários vejam dados básicos de alunos que postaram no feed
-- Isso é necessário para exibir nome e avatar no feed de treinos
CREATE POLICY "Users can view basic info of students who posted in training feed"
ON students
FOR SELECT
USING (
  -- Usuário autenticado pode ver nome e avatar de alunos que fizeram posts no feed
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM training_posts tp
    WHERE tp.student_id = students.id
  )
);