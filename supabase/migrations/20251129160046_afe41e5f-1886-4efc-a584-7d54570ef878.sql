-- Drop the old address column and add separate address fields
ALTER TABLE public.clients DROP COLUMN address;

ALTER TABLE public.clients 
  ADD COLUMN street TEXT NOT NULL DEFAULT '',
  ADD COLUMN city TEXT NOT NULL DEFAULT '',
  ADD COLUMN postal_code TEXT NOT NULL DEFAULT '',
  ADD COLUMN country TEXT NOT NULL DEFAULT '';

-- Remove defaults after adding columns
ALTER TABLE public.clients 
  ALTER COLUMN street DROP DEFAULT,
  ALTER COLUMN city DROP DEFAULT,
  ALTER COLUMN postal_code DROP DEFAULT,
  ALTER COLUMN country DROP DEFAULT;