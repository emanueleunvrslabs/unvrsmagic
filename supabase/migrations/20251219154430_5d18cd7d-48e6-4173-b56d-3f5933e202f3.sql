-- Allow public to look up user_id by ref_code (for Memora submit page)
CREATE POLICY "Anyone can lookup user by ref_code"
ON public.profiles
FOR SELECT
USING (true);