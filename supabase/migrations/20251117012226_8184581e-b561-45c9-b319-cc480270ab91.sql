-- Add passphrase column to exchange_keys table
ALTER TABLE public.exchange_keys 
ADD COLUMN passphrase text;