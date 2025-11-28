-- Create storage bucket for uploaded files
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', false);

-- Create table to track uploaded files
CREATE TABLE IF NOT EXISTS public.uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  original_name TEXT NOT NULL,
  is_extracted BOOLEAN DEFAULT false,
  parent_zip_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on uploaded_files
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for uploaded_files
CREATE POLICY "Users can view their own files"
  ON public.uploaded_files
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own files"
  ON public.uploaded_files
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own files"
  ON public.uploaded_files
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files"
  ON public.uploaded_files
  FOR DELETE
  USING (auth.uid() = user_id);

-- Storage policies for uploads bucket
CREATE POLICY "Users can upload their own files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Trigger to update updated_at
CREATE TRIGGER update_uploaded_files_updated_at
  BEFORE UPDATE ON public.uploaded_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();