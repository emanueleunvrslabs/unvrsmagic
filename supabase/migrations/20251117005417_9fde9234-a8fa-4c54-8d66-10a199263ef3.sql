-- Add key_id column to api_keys table for providers that need it (like Qwen3)
ALTER TABLE public.api_keys 
ADD COLUMN key_id TEXT;