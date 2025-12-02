-- Create table for ARERA deliberations
CREATE TABLE public.arera_delibere (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  delibera_code TEXT NOT NULL UNIQUE,
  publication_date DATE,
  title TEXT NOT NULL,
  description TEXT,
  summary TEXT,
  detail_url TEXT,
  files JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.arera_delibere ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view all delibere" 
ON public.arera_delibere 
FOR SELECT 
USING (true);

CREATE POLICY "Service role can manage all delibere" 
ON public.arera_delibere 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_arera_delibere_updated_at
BEFORE UPDATE ON public.arera_delibere
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for ARERA files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('arera-files', 'arera-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "ARERA files are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'arera-files');

CREATE POLICY "Service role can manage ARERA files" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'arera-files')
WITH CHECK (bucket_id = 'arera-files');