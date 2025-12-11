-- Create client_todos table
CREATE TABLE public.client_todos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_todos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own client todos"
ON public.client_todos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own client todos"
ON public.client_todos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own client todos"
ON public.client_todos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own client todos"
ON public.client_todos FOR DELETE
USING (auth.uid() = user_id);