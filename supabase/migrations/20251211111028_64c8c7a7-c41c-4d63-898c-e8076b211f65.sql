-- Create client_kanban_tasks table
CREATE TABLE public.client_kanban_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_kanban_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own kanban tasks"
ON public.client_kanban_tasks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own kanban tasks"
ON public.client_kanban_tasks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own kanban tasks"
ON public.client_kanban_tasks
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own kanban tasks"
ON public.client_kanban_tasks
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_client_kanban_tasks_updated_at
BEFORE UPDATE ON public.client_kanban_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();