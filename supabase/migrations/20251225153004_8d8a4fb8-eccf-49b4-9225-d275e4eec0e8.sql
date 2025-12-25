-- Make ai-social-uploads bucket private
UPDATE storage.buckets SET public = false WHERE id = 'ai-social-uploads';

-- Drop existing overly permissive policies on ai-social-uploads
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to read ai-social-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own uploads" ON storage.objects;

-- Create proper RLS policies for ai-social-uploads bucket
-- Users can only access their own files (files stored in folder named with their user_id)
CREATE POLICY "Users can read their own ai-social uploads"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ai-social-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload to their own ai-social folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ai-social-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own ai-social uploads"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'ai-social-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own ai-social uploads"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'ai-social-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);