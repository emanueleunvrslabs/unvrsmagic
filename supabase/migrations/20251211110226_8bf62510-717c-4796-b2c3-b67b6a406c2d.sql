-- Create client_documents table
CREATE TABLE public.client_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own client documents"
ON public.client_documents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own client documents"
ON public.client_documents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own client documents"
ON public.client_documents FOR DELETE
USING (auth.uid() = user_id);

-- Create storage bucket for client documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('client-documents', 'client-documents', true);

-- Storage policies
CREATE POLICY "Users can upload client documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'client-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view client documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'client-documents');

CREATE POLICY "Users can delete their client documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'client-documents' AND auth.uid() IS NOT NULL);