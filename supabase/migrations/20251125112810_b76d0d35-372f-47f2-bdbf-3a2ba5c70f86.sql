-- Create storage bucket for dispatch files
INSERT INTO storage.buckets (id, name, public)
VALUES ('dispatch-files', 'dispatch-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for dispatch-files bucket
CREATE POLICY "Users can upload their own dispatch files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'dispatch-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own dispatch files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'dispatch-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own dispatch files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'dispatch-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own dispatch files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'dispatch-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );