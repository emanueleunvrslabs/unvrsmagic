-- Set user_id to automatically use auth.uid() as default
ALTER TABLE public.clients 
  ALTER COLUMN user_id SET DEFAULT auth.uid();