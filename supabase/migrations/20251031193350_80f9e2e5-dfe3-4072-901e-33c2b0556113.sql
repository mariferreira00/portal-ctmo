-- Update the training_posts_with_stats view to include avatar_url and fix security definer issue
DROP VIEW IF EXISTS training_posts_with_stats;

CREATE VIEW training_posts_with_stats AS
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
  s.full_name as student_name,
  s.avatar_url as student_avatar_url,
  COUNT(DISTINCT pr.id) as reaction_count,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'type', pr.reaction_type,
        'count', reaction_counts.count
      )
    ) FILTER (WHERE pr.reaction_type IS NOT NULL),
    '[]'::json
  ) as reactions_summary
FROM training_posts tp
LEFT JOIN students s ON tp.student_id = s.id
LEFT JOIN post_reactions pr ON tp.id = pr.post_id
LEFT JOIN (
  SELECT post_id, reaction_type, COUNT(*) as count
  FROM post_reactions
  GROUP BY post_id, reaction_type
) reaction_counts ON tp.id = reaction_counts.post_id AND pr.reaction_type = reaction_counts.reaction_type
GROUP BY tp.id, tp.student_id, tp.class_id, tp.photo_url, tp.thumbnail_url, 
         tp.caption, tp.training_date, tp.created_at, tp.updated_at, 
         s.full_name, s.avatar_url;