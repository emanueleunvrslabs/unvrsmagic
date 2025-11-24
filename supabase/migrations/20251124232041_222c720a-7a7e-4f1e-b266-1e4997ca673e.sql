-- Enable realtime for ai_social_content table
ALTER TABLE public.ai_social_content REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_social_content;