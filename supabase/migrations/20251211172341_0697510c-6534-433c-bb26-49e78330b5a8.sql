-- Fix Critical Issue: Remove overly permissive RLS policy on otp_codes table
-- The service role already bypasses RLS by default, so this policy is unnecessary
-- and creates a critical security vulnerability allowing any user to read/modify OTP codes

DROP POLICY IF EXISTS "Service role can manage OTP codes" ON public.otp_codes;