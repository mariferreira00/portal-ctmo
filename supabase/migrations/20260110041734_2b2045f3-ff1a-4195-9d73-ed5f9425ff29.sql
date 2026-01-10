-- =====================================================
-- CORRIGIR VIEW training_posts_with_stats PARA USAR SECURITY INVOKER
-- E adicionar RLS bypass na tabela students apenas para nome/avatar
-- =====================================================

-- Dropar a view atual
DROP VIEW IF EXISTS training_posts_with_stats;

-- Dropar a função que criamos
DROP FUNCTION IF EXISTS get_training_posts_with_stats();

-- Criar função específica para buscar nome e avatar de qualquer estudante
-- Esta função é segura pois só retorna informações públicas (nome e avatar)
CREATE OR REPLACE FUNCTION public.get_student_display_info(p_student_id uuid)
RETURNS TABLE (full_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.full_name, s.avatar_url
  FROM students s
  WHERE s.id = p_student_id;
$$;

-- Recriar a view usando a função para buscar nome/avatar
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
  (SELECT full_name FROM get_student_display_info(tp.student_id)) AS student_name,
  (SELECT avatar_url FROM get_student_display_info(tp.student_id)) AS student_avatar_url,
  (SELECT count(*) FROM post_reactions pr WHERE pr.post_id = tp.id) AS reaction_count,
  COALESCE(
    (
      SELECT json_agg(jsonb_build_object('type', reaction_type, 'count', cnt))
      FROM (
        SELECT reaction_type, count(*) as cnt
        FROM post_reactions
        WHERE post_id = tp.id
        GROUP BY reaction_type
      ) reaction_counts
    ),
    '[]'::json
  ) AS reactions_summary
FROM training_posts tp;