-- Create storage bucket for email attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-attachments', 'email-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for authenticated users to upload
CREATE POLICY "Authenticated users can upload email attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'email-attachments');

-- Create policy for public read access
CREATE POLICY "Public can view email attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'email-attachments');