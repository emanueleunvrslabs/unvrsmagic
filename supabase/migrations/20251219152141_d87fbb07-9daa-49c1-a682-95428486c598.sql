-- Allow public access to lookup user_id by username (for Memora public links)
CREATE POLICY "Anyone can lookup user_id by username" 
ON public.profiles 
FOR SELECT 
USING (true);