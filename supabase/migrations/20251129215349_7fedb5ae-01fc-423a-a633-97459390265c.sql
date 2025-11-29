-- Create client_projects junction table to link clients with projects
CREATE TABLE IF NOT EXISTS public.client_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_projects ENABLE ROW LEVEL SECURITY;

-- Owner can manage all client projects
CREATE POLICY "Owner can manage all client projects"
ON public.client_projects
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

-- Create index for faster queries
CREATE INDEX idx_client_projects_client_id ON public.client_projects(client_id);

-- Add trigger for updated_at
CREATE TRIGGER update_client_projects_updated_at
BEFORE UPDATE ON public.client_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();