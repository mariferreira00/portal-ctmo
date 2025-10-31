-- Add avatar_url to students and teachers tables
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS avatar_url text;

ALTER TABLE public.teachers 
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for avatars bucket
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Students can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'students'
  AND (storage.foldername(name))[2] = (
    SELECT id::text 
    FROM public.students 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Teachers can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'teachers'
  AND (storage.foldername(name))[2] = (
    SELECT id::text 
    FROM public.teachers 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Students can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'students'
  AND (storage.foldername(name))[2] = (
    SELECT id::text 
    FROM public.students 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Teachers can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'teachers'
  AND (storage.foldername(name))[2] = (
    SELECT id::text 
    FROM public.teachers 
    WHERE user_id = auth.uid()
  )
);