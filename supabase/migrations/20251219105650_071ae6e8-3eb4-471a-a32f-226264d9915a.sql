-- Create table for demo bookings/video calls
CREATE TABLE public.demo_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  project_type TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'scheduled',
  meeting_link TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.demo_bookings ENABLE ROW LEVEL SECURITY;

-- Owner can manage all bookings
CREATE POLICY "Owner can manage all demo bookings"
ON public.demo_bookings
FOR ALL
USING (has_role(auth.uid(), 'owner'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_demo_bookings_updated_at
BEFORE UPDATE ON public.demo_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();