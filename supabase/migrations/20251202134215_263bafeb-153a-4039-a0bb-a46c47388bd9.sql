-- Add RLS policies for client_project_workflows table
ALTER TABLE public.client_project_workflows ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own workflows
CREATE POLICY "Users can view their own client project workflows"
ON public.client_project_workflows
FOR SELECT
USING (auth.uid() = user_id);

-- Policy for users to create their own workflows
CREATE POLICY "Users can create their own client project workflows"
ON public.client_project_workflows
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own workflows
CREATE POLICY "Users can update their own client project workflows"
ON public.client_project_workflows
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy for users to delete their own workflows
CREATE POLICY "Users can delete their own client project workflows"
ON public.client_project_workflows
FOR DELETE
USING (auth.uid() = user_id);