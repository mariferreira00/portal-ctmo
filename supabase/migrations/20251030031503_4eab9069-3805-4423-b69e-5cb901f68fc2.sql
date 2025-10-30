-- Create achievements table
CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL, -- 'attendance', 'training', 'special', 'milestone'
  requirement_type text NOT NULL, -- 'attendance_count', 'consecutive_days', 'months_active', 'custom'
  requirement_value integer NOT NULL,
  points integer NOT NULL DEFAULT 10,
  rarity text NOT NULL DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user achievements table
CREATE TABLE public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL,
  achievement_id uuid NOT NULL,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  progress integer DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  UNIQUE(student_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements (everyone can view)
CREATE POLICY "Everyone can view achievements"
ON public.achievements
FOR SELECT
USING (active = true);

CREATE POLICY "Admins can manage achievements"
ON public.achievements
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
ON public.user_achievements
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all user achievements"
ON public.user_achievements
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Instructors can view achievements of their students"
ON public.user_achievements
FOR SELECT
USING (
  has_role(auth.uid(), 'instructor'::app_role) 
  AND student_id IN (
    SELECT ce.student_id
    FROM class_enrollments ce
    JOIN classes c ON c.id = ce.class_id
    JOIN teachers t ON t.id = c.teacher_id
    WHERE t.user_id = auth.uid()
  )
);

CREATE POLICY "System can create user achievements"
ON public.user_achievements
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update user achievements"
ON public.user_achievements
FOR UPDATE
USING (true);

-- Insert initial achievements
INSERT INTO public.achievements (name, description, icon, category, requirement_type, requirement_value, points, rarity) VALUES
-- Attendance achievements
('Primeiro Passo', 'Complete sua primeira aula', 'Footprints', 'attendance', 'attendance_count', 1, 10, 'common'),
('Dedicação', 'Complete 10 aulas', 'Target', 'attendance', 'attendance_count', 10, 25, 'common'),
('Guerreiro', 'Complete 50 aulas', 'Sword', 'attendance', 'attendance_count', 50, 50, 'rare'),
('Mestre do Dojo', 'Complete 100 aulas', 'Crown', 'attendance', 'attendance_count', 100, 100, 'epic'),
('Lenda Viva', 'Complete 500 aulas', 'Trophy', 'attendance', 'attendance_count', 500, 500, 'legendary'),

-- Consecutive days
('Consistência', 'Treine 3 dias seguidos', 'Calendar', 'training', 'consecutive_days', 3, 15, 'common'),
('Disciplina', 'Treine 7 dias seguidos', 'CalendarCheck', 'training', 'consecutive_days', 7, 30, 'rare'),
('Inabalável', 'Treine 30 dias seguidos', 'Flame', 'training', 'consecutive_days', 30, 100, 'epic'),

-- Milestones
('Novato', 'Complete 1 mês de treino', 'Star', 'milestone', 'months_active', 1, 20, 'common'),
('Dedicado', 'Complete 3 meses de treino', 'Award', 'milestone', 'months_active', 3, 50, 'rare'),
('Veterano', 'Complete 6 meses de treino', 'Medal', 'milestone', 'months_active', 6, 100, 'epic'),
('Campeão', 'Complete 1 ano de treino', 'Trophy', 'milestone', 'months_active', 12, 200, 'legendary');

-- Create function to check and unlock achievements
CREATE OR REPLACE FUNCTION public.check_and_unlock_achievements(_student_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _achievement RECORD;
  _attendance_count INTEGER;
  _months_active INTEGER;
  _student_created_at TIMESTAMP;
BEGIN
  -- Get student data
  SELECT created_at INTO _student_created_at
  FROM students
  WHERE id = _student_id;

  -- Count total attendance
  SELECT COUNT(*) INTO _attendance_count
  FROM attendance
  WHERE student_id = _student_id;

  -- Calculate months active
  _months_active := EXTRACT(EPOCH FROM (now() - _student_created_at)) / (30 * 24 * 60 * 60);

  -- Check attendance-based achievements
  FOR _achievement IN 
    SELECT * FROM achievements 
    WHERE requirement_type = 'attendance_count' 
    AND active = true
  LOOP
    IF _attendance_count >= _achievement.requirement_value THEN
      -- Insert or update user achievement
      INSERT INTO user_achievements (student_id, achievement_id, progress, completed)
      VALUES (_student_id, _achievement.id, _attendance_count, true)
      ON CONFLICT (student_id, achievement_id) 
      DO UPDATE SET 
        progress = _attendance_count,
        completed = true,
        unlocked_at = CASE 
          WHEN user_achievements.completed = false THEN now() 
          ELSE user_achievements.unlocked_at 
        END;
    ELSE
      -- Update progress
      INSERT INTO user_achievements (student_id, achievement_id, progress, completed)
      VALUES (_student_id, _achievement.id, _attendance_count, false)
      ON CONFLICT (student_id, achievement_id) 
      DO UPDATE SET progress = _attendance_count;
    END IF;
  END LOOP;

  -- Check milestone achievements
  FOR _achievement IN 
    SELECT * FROM achievements 
    WHERE requirement_type = 'months_active' 
    AND active = true
  LOOP
    IF _months_active >= _achievement.requirement_value THEN
      INSERT INTO user_achievements (student_id, achievement_id, progress, completed)
      VALUES (_student_id, _achievement.id, _months_active, true)
      ON CONFLICT (student_id, achievement_id) 
      DO UPDATE SET 
        progress = _months_active,
        completed = true,
        unlocked_at = CASE 
          WHEN user_achievements.completed = false THEN now() 
          ELSE user_achievements.unlocked_at 
        END;
    ELSE
      INSERT INTO user_achievements (student_id, achievement_id, progress, completed)
      VALUES (_student_id, _achievement.id, _months_active, false)
      ON CONFLICT (student_id, achievement_id) 
      DO UPDATE SET progress = _months_active;
    END IF;
  END LOOP;
END;
$$;

-- Create trigger to check achievements after attendance
CREATE OR REPLACE FUNCTION public.trigger_check_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM check_and_unlock_achievements(NEW.student_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_achievements_after_attendance
AFTER INSERT ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION trigger_check_achievements();