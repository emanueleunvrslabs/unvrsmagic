-- Add category column to arera_delibere table
ALTER TABLE public.arera_delibere 
ADD COLUMN category text DEFAULT 'generale';

-- Add comment for documentation
COMMENT ON COLUMN public.arera_delibere.category IS 'Category of the deliberation: elettricita, gas, acqua, rifiuti, teleriscaldamento, generale';