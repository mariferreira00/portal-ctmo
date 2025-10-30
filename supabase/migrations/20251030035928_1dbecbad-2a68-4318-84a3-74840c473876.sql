-- Training Posts System - Phase 1 MVP
-- Implements photo posting feature similar to GymRats

-- ============================================
-- 1. CREATE STORAGE BUCKET FOR TRAINING PHOTOS
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'training-photos',
  'training-photos',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Students can upload their own training photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'training-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view training photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'training-photos');

CREATE POLICY "Students can delete their own training photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'training-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- 2. CREATE TRAINING POSTS TABLE
-- ============================================

CREATE TABLE public.training_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  photo_url text NOT NULL,
  thumbnail_url text,
  caption text,
  training_date date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_caption_length CHECK (caption IS NULL OR length(caption) <= 500),
  CONSTRAINT valid_training_date CHECK (training_date <= CURRENT_DATE),
  CONSTRAINT one_post_per_day UNIQUE (student_id, training_date)
);

-- Add indexes for performance
CREATE INDEX idx_training_posts_student ON public.training_posts(student_id);
CREATE INDEX idx_training_posts_class ON public.training_posts(class_id);
CREATE INDEX idx_training_posts_date ON public.training_posts(training_date DESC);
CREATE INDEX idx_training_posts_created ON public.training_posts(created_at DESC);

-- Enable RLS
ALTER TABLE public.training_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training_posts
CREATE POLICY "Students can view posts from their classes"
ON public.training_posts
FOR SELECT
USING (
  -- Own posts
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  OR
  -- Posts from classmates
  EXISTS (
    SELECT 1 FROM students s1
    JOIN class_enrollments ce1 ON s1.id = ce1.student_id
    JOIN class_enrollments ce2 ON ce1.class_id = ce2.class_id
    JOIN students s2 ON ce2.student_id = s2.id
    WHERE s1.user_id = auth.uid()
      AND training_posts.student_id = s2.id
  )
  OR
  -- Instructors can view posts from their students
  (
    has_role(auth.uid(), 'instructor'::app_role)
    AND EXISTS (
      SELECT 1 FROM students s
      JOIN class_enrollments ce ON s.id = ce.student_id
      JOIN classes c ON ce.class_id = c.id
      JOIN teachers t ON c.teacher_id = t.id
      WHERE t.user_id = auth.uid()
        AND training_posts.student_id = s.id
    )
  )
  OR
  -- Admins can view all
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Students can create their own posts"
ON public.training_posts
FOR INSERT
WITH CHECK (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

CREATE POLICY "Students can update their own posts"
ON public.training_posts
FOR UPDATE
USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

CREATE POLICY "Students can delete their own posts"
ON public.training_posts
FOR DELETE
USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- ============================================
-- 3. CREATE POST REACTIONS TABLE
-- ============================================

CREATE TABLE public.post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.training_posts(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  reaction_type text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- One reaction per student per post
  CONSTRAINT unique_reaction_per_user UNIQUE (post_id, student_id),
  CONSTRAINT valid_reaction_type CHECK (reaction_type IN ('fire', 'strong', 'clap', 'star', 'hundred'))
);

-- Add indexes
CREATE INDEX idx_post_reactions_post ON public.post_reactions(post_id);
CREATE INDEX idx_post_reactions_student ON public.post_reactions(student_id);

-- Enable RLS
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_reactions
CREATE POLICY "Anyone can view reactions"
ON public.post_reactions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Students can add reactions"
ON public.post_reactions
FOR INSERT
WITH CHECK (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

CREATE POLICY "Students can update their own reactions"
ON public.post_reactions
FOR UPDATE
USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

CREATE POLICY "Students can delete their own reactions"
ON public.post_reactions
FOR DELETE
USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

-- ============================================
-- 4. CREATE UPDATED_AT TRIGGER
-- ============================================

CREATE TRIGGER update_training_posts_updated_at
BEFORE UPDATE ON public.training_posts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 5. CREATE VIEW FOR POST STATS
-- ============================================

CREATE OR REPLACE VIEW public.training_posts_with_stats AS
SELECT 
  tp.*,
  s.full_name as student_name,
  COUNT(DISTINCT pr.id) as reaction_count,
  json_agg(
    DISTINCT jsonb_build_object(
      'type', pr.reaction_type,
      'count', (SELECT COUNT(*) FROM post_reactions WHERE post_id = tp.id AND reaction_type = pr.reaction_type)
    )
  ) FILTER (WHERE pr.id IS NOT NULL) as reactions_summary
FROM public.training_posts tp
JOIN public.students s ON tp.student_id = s.id
LEFT JOIN public.post_reactions pr ON tp.id = pr.post_id
GROUP BY tp.id, s.full_name;

-- ============================================
-- 6. CREATE FUNCTION TO GET STUDENT STREAK
-- ============================================

CREATE OR REPLACE FUNCTION public.get_training_streak(p_student_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_streak integer := 0;
  check_date date := CURRENT_DATE;
  has_post boolean;
BEGIN
  -- Check consecutive days backwards from today
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM training_posts
      WHERE student_id = p_student_id
        AND training_date = check_date
    ) INTO has_post;
    
    EXIT WHEN NOT has_post;
    
    current_streak := current_streak + 1;
    check_date := check_date - INTERVAL '1 day';
  END LOOP;
  
  RETURN current_streak;
END;
$$;

-- ============================================
-- 7. ADD NEW ACHIEVEMENTS FOR TRAINING POSTS
-- ============================================

INSERT INTO public.achievements (name, description, icon, category, requirement_type, requirement_value, points, rarity) VALUES
('Primeira Foto', 'Poste sua primeira foto de treino', '📸', 'training', 'posts_count', 1, 10, 'common'),
('Fotógrafo Dedicado', 'Poste 10 fotos de treino', '📷', 'training', 'posts_count', 10, 30, 'rare'),
('Estrela do Feed', 'Poste 50 fotos de treino', '🌟', 'training', 'posts_count', 50, 100, 'epic'),
('Sequência de Fogo', 'Poste por 7 dias consecutivos', '🔥', 'training', 'streak_days', 7, 50, 'rare'),
('Disciplina Absoluta', 'Poste por 30 dias consecutivos', '💪', 'training', 'streak_days', 30, 200, 'legendary')
ON CONFLICT DO NOTHING;

-- ============================================
-- 8. CREATE FUNCTION TO CHECK POST ACHIEVEMENTS
-- ============================================

CREATE OR REPLACE FUNCTION public.check_post_achievements(p_student_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_achievement RECORD;
  v_posts_count integer;
  v_streak integer;
BEGIN
  -- Count total posts
  SELECT COUNT(*) INTO v_posts_count
  FROM training_posts
  WHERE student_id = p_student_id;
  
  -- Get current streak
  v_streak := get_training_streak(p_student_id);
  
  -- Check posts_count achievements
  FOR v_achievement IN 
    SELECT * FROM achievements 
    WHERE requirement_type = 'posts_count' 
    AND active = true
  LOOP
    IF v_posts_count >= v_achievement.requirement_value THEN
      INSERT INTO user_achievements (student_id, achievement_id, progress, completed)
      VALUES (p_student_id, v_achievement.id, v_posts_count, true)
      ON CONFLICT (student_id, achievement_id) 
      DO UPDATE SET 
        progress = v_posts_count,
        completed = true,
        unlocked_at = CASE 
          WHEN user_achievements.completed = false THEN now() 
          ELSE user_achievements.unlocked_at 
        END;
    ELSE
      INSERT INTO user_achievements (student_id, achievement_id, progress, completed)
      VALUES (p_student_id, v_achievement.id, v_posts_count, false)
      ON CONFLICT (student_id, achievement_id) 
      DO UPDATE SET progress = v_posts_count;
    END IF;
  END LOOP;
  
  -- Check streak_days achievements
  FOR v_achievement IN 
    SELECT * FROM achievements 
    WHERE requirement_type = 'streak_days' 
    AND active = true
  LOOP
    IF v_streak >= v_achievement.requirement_value THEN
      INSERT INTO user_achievements (student_id, achievement_id, progress, completed)
      VALUES (p_student_id, v_achievement.id, v_streak, true)
      ON CONFLICT (student_id, achievement_id) 
      DO UPDATE SET 
        progress = v_streak,
        completed = true,
        unlocked_at = CASE 
          WHEN user_achievements.completed = false THEN now() 
          ELSE user_achievements.unlocked_at 
        END;
    ELSE
      INSERT INTO user_achievements (student_id, achievement_id, progress, completed)
      VALUES (p_student_id, v_achievement.id, v_streak, false)
      ON CONFLICT (student_id, achievement_id) 
      DO UPDATE SET progress = v_streak;
    END IF;
  END LOOP;
END;
$$;

-- ============================================
-- 9. CREATE TRIGGER TO AUTO-CHECK ACHIEVEMENTS
-- ============================================

CREATE OR REPLACE FUNCTION public.trigger_check_post_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM check_post_achievements(NEW.student_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER after_training_post_insert
AFTER INSERT ON public.training_posts
FOR EACH ROW
EXECUTE FUNCTION public.trigger_check_post_achievements();