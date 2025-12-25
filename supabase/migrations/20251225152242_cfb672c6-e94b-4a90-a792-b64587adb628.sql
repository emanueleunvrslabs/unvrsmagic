-- Fix profiles public lookup security issue
-- Drop overly permissive policies that expose all profile data publicly

DROP POLICY IF EXISTS "Anyone can lookup user_id by username" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can lookup user by ref_code" ON public.profiles;

-- Create secure lookup functions that only return user_id (no sensitive data)
CREATE OR REPLACE FUNCTION public.lookup_user_by_username(username_param TEXT) 
RETURNS UUID 
LANGUAGE SQL 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM profiles WHERE username = username_param LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.lookup_user_by_ref_code(ref_code_param TEXT) 
RETURNS UUID 
LANGUAGE SQL 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM profiles WHERE ref_code = ref_code_param LIMIT 1;
$$;