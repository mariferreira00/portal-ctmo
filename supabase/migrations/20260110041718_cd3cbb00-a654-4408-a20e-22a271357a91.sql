-- =====================================================
-- RECRIAR VIEW training_posts_with_stats COM SECURITY INVOKER FALSE
-- Isso garante que os dados do estudante sempre apareçam
-- =====================================================

-- Primeiro, dropar a view existente
DROP VIEW IF EXISTS training_posts_with_stats;

-- Criar uma função SECURITY DEFINER para buscar os posts com stats
CREATE OR REPLACE FUNCTION public.get_training_posts_with_stats()
RETURNS TABLE (
  id uuid,
  student_id uuid,
  class_id uuid,
  photo_url text,
  thumbnail_url text,
  caption text,
  training_date date,
  created_at timestamptz,
  updated_at timestamptz,
  student_name text,
  student_avatar_url text,
  reaction_count bigint,
  reactions_summary json
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
        DISTINCT jsonb_build_object('type', pr.reaction_type, 'count', reaction_counts.count)
      ) FILTER (WHERE pr.reaction_type IS NOT NULL), 
      '[]'::json
    ) AS reactions_summary
  FROM training_posts tp
  LEFT JOIN students s ON tp.student_id = s.id
  LEFT JOIN post_reactions pr ON tp.id = pr.post_id
  LEFT JOIN (
    SELECT post_id, reaction_type, count(*) AS count
    FROM post_reactions
    GROUP BY post_id, reaction_type
  ) reaction_counts ON tp.id = reaction_counts.post_id AND pr.reaction_type = reaction_counts.reaction_type
  GROUP BY tp.id, tp.student_id, tp.class_id, tp.photo_url, tp.thumbnail_url, 
           tp.caption, tp.training_date, tp.created_at, tp.updated_at, 
           s.full_name, s.avatar_url;
$$;

-- Recriar a view usando a função
CREATE VIEW training_posts_with_stats AS
SELECT * FROM get_training_posts_with_stats();