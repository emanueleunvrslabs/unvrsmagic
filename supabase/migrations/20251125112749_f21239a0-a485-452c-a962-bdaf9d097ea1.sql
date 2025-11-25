-- Enable RLS on dispatch_zones table
ALTER TABLE public.dispatch_zones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dispatch_zones (readable by all authenticated users)
CREATE POLICY "Zones are viewable by authenticated users"
  ON public.dispatch_zones FOR SELECT
  USING (auth.uid() IS NOT NULL);