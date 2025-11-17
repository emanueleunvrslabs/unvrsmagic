-- Add username column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Add index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Add constraint to ensure username is lowercase and no spaces
ALTER TABLE public.profiles ADD CONSTRAINT username_format CHECK (username = lower(username) AND username !~ '\s');