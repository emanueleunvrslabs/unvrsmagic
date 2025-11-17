-- Create agent_prompts table
CREATE TABLE IF NOT EXISTS public.agent_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, agent_id)
);

-- Enable RLS
ALTER TABLE public.agent_prompts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own prompts"
ON public.agent_prompts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prompts"
ON public.agent_prompts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompts"
ON public.agent_prompts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompts"
ON public.agent_prompts FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_agent_prompts_updated_at
BEFORE UPDATE ON public.agent_prompts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();