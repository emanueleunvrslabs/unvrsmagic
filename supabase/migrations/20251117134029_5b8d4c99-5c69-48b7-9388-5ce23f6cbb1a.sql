-- Add failed_attempts column to otp_codes table
ALTER TABLE public.otp_codes 
ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0;