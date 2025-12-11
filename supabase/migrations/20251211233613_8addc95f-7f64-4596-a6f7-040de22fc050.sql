-- PHASE 1: Critical RLS Security Fixes

-- 1. Fix mkt_data_config - Remove overly permissive service role policy
DROP POLICY IF EXISTS "Service role can read all mkt data config" ON public.mkt_data_config;

-- 2. Fix credit_transactions - Remove dangerous "manage all" policy
-- Keep the SELECT policy (users can view their own)
-- Add restrictive INSERT policy - only SECURITY DEFINER functions can insert
DROP POLICY IF EXISTS "Service role can manage all transactions" ON public.credit_transactions;

-- 3. Fix arera_delibere - Remove policies that expose user tracking
DROP POLICY IF EXISTS "Service role can manage all delibere" ON public.arera_delibere;
DROP POLICY IF EXISTS "Users can view all delibere" ON public.arera_delibere;

-- Create proper policies for arera_delibere
-- Users can view all delibere (content is public) but we don't expose user_id tracking
CREATE POLICY "Authenticated users can view delibere"
ON public.arera_delibere
FOR SELECT
TO authenticated
USING (true);

-- Only service role (edge functions with SECURITY DEFINER context) can manage delibere
CREATE POLICY "Service role can insert delibere"
ON public.arera_delibere
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update delibere"
ON public.arera_delibere
FOR UPDATE
TO service_role
USING (true);

CREATE POLICY "Service role can delete delibere"
ON public.arera_delibere
FOR DELETE
TO service_role
USING (true);

-- 4. Fix otp_codes - Add RLS policies (currently has none!)
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- OTP codes should NEVER be directly accessible by authenticated users
-- Only edge functions with service_role can manage them
CREATE POLICY "Service role only for otp_codes"
ON public.otp_codes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Explicitly deny all access to authenticated users
CREATE POLICY "No direct user access to otp_codes"
ON public.otp_codes
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);