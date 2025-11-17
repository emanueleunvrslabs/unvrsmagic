-- Rename key_id column to owner_id for Alibaba/Qwen
ALTER TABLE public.api_keys RENAME COLUMN key_id TO owner_id;