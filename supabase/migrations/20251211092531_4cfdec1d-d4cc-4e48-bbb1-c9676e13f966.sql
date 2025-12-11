-- Drop the overly permissive RLS policy on arera_email_preferences
-- Service role already bypasses RLS, so this policy is unnecessary and creates a security hole
DROP POLICY IF EXISTS "Service role can read all preferences" ON public.arera_email_preferences;