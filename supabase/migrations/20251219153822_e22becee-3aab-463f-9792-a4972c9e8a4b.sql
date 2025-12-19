-- Make sensitive storage buckets private
UPDATE storage.buckets SET public = false WHERE name = 'uploads';
UPDATE storage.buckets SET public = false WHERE name = 'email-attachments';
UPDATE storage.buckets SET public = false WHERE name = 'client-documents';