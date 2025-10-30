-- Fix security definer view by recreating without SECURITY DEFINER and fixing aggregation
DROP VIEW IF EXISTS training_posts_with_stats;

CREATE VIEW training_posts_with_stats AS
SELECT 
  tp.*,
  s.full_name as student_name,
  COUNT(pr.id) as reaction_count,
  CASE 
    WHEN COUNT(pr.id) > 0 THEN 
      (
        SELECT json_agg(reaction_summary)
        FROM (
          SELECT 
            pr2.reaction_type as type,
            COUNT(pr2.id) as count
          FROM post_reactions pr2
          WHERE pr2.post_id = tp.id
          GROUP BY pr2.reaction_type
        ) reaction_summary
      )
    ELSE NULL
  END as reactions_summary
FROM training_posts tp
LEFT JOIN students s ON tp.student_id = s.id
LEFT JOIN post_reactions pr ON tp.id = pr.post_id
GROUP BY tp.id, tp.student_id, tp.class_id, tp.photo_url, tp.thumbnail_url, 
         tp.caption, tp.training_date, tp.created_at, tp.updated_at, s.full_name;