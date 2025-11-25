-- Drop the restrictive policy
DROP POLICY IF EXISTS "Zones are viewable by authenticated users" ON public.dispatch_zones;

-- Create a proper permissive policy for viewing zones
CREATE POLICY "Zones are viewable by authenticated users" 
ON public.dispatch_zones 
FOR SELECT 
TO authenticated
USING (true);