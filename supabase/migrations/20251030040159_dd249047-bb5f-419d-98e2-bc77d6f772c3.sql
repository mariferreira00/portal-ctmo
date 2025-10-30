-- Enable Realtime for training_posts table
ALTER PUBLICATION supabase_realtime ADD TABLE public.training_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reactions;