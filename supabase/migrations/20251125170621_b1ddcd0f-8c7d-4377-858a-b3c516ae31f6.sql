-- Create storage bucket for AI Social workflow images
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-social-uploads', 'ai-social-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Users can upload workflow images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ai-social-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to view their own files
CREATE POLICY "Users can view their workflow images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'ai-social-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their workflow images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ai-social-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access for generated content
CREATE POLICY "Public can view ai-social-uploads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'ai-social-uploads');