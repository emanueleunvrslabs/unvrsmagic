-- Add ref_code column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ref_code text UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_ref_code ON public.profiles(ref_code);

-- Function to generate random ref code
CREATE OR REPLACE FUNCTION public.generate_ref_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Generate ref codes for existing users without one
UPDATE public.profiles 
SET ref_code = public.generate_ref_code()
WHERE ref_code IS NULL;

-- Trigger to auto-generate ref_code on new profile creation
CREATE OR REPLACE FUNCTION public.set_profile_ref_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ref_code IS NULL THEN
    NEW.ref_code := public.generate_ref_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_set_ref_code ON public.profiles;
CREATE TRIGGER on_profile_set_ref_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_profile_ref_code();