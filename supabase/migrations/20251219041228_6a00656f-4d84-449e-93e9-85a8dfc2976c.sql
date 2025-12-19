-- Add coming_soon column to marketplace_projects
ALTER TABLE public.marketplace_projects
ADD COLUMN coming_soon boolean DEFAULT false;