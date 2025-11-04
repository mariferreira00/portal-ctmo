
-- Drop políticas duplicadas de SELECT em training_posts
DROP POLICY IF EXISTS "Students can view posts from their classes and own posts" ON training_posts;
DROP POLICY IF EXISTS "Students can view posts from their classes" ON training_posts;
DROP POLICY IF EXISTS "Instructors can view posts from their students" ON training_posts;

-- Criar uma única política consolidada para visualização de posts
CREATE POLICY "Users can view posts from their context"
ON training_posts
FOR SELECT
USING (
  -- Admins podem ver tudo
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Estudantes podem ver seus próprios posts
  (student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  ))
  OR
  -- Estudantes podem ver posts de colegas que compartilham pelo menos uma turma
  EXISTS (
    SELECT 1
    FROM class_enrollments ce1
    JOIN class_enrollments ce2 ON ce1.class_id = ce2.class_id
    JOIN students s1 ON s1.id = ce1.student_id
    WHERE s1.user_id = auth.uid()
      AND ce2.student_id = training_posts.student_id
  )
  OR
  -- Instrutores podem ver posts de alunos em suas turmas
  (
    has_role(auth.uid(), 'instructor'::app_role)
    AND EXISTS (
      SELECT 1
      FROM students s
      JOIN class_enrollments ce ON ce.student_id = s.id
      JOIN classes c ON c.id = ce.class_id
      JOIN teachers t ON t.id = c.teacher_id
      WHERE s.id = training_posts.student_id
        AND t.user_id = auth.uid()
    )
  )
);

-- Recriar a view com SECURITY INVOKER explícito para garantir que RLS seja aplicado
DROP VIEW IF EXISTS training_posts_with_stats;

CREATE VIEW training_posts_with_stats
WITH (security_invoker = true)
AS
SELECT 
  tp.id,
  tp.student_id,
  tp.class_id,
  tp.photo_url,
  tp.thumbnail_url,
  tp.caption,
  tp.training_date,
  tp.created_at,
  tp.updated_at,
  s.full_name AS student_name,
  s.avatar_url AS student_avatar_url,
  count(DISTINCT pr.id) AS reaction_count,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'type', pr.reaction_type, 
        'count', reaction_counts.count
      )
    ) FILTER (WHERE pr.reaction_type IS NOT NULL), 
    '[]'::json
  ) AS reactions_summary
FROM training_posts tp
LEFT JOIN students s ON tp.student_id = s.id
LEFT JOIN post_reactions pr ON tp.id = pr.post_id
LEFT JOIN (
  SELECT 
    post_id,
    reaction_type,
    count(*) AS count
  FROM post_reactions
  GROUP BY post_id, reaction_type
) reaction_counts ON tp.id = reaction_counts.post_id 
  AND pr.reaction_type = reaction_counts.reaction_type
GROUP BY 
  tp.id, 
  tp.student_id, 
  tp.class_id, 
  tp.photo_url, 
  tp.thumbnail_url, 
  tp.caption, 
  tp.training_date, 
  tp.created_at, 
  tp.updated_at, 
  s.full_name, 
  s.avatar_url;
