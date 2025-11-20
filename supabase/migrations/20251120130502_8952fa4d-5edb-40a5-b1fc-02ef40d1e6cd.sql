-- Create agent_messages table for inter-agent communication
CREATE TABLE IF NOT EXISTS public.agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_agent TEXT NOT NULL,
  receiver_agent TEXT NOT NULL,
  message_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  priority INTEGER DEFAULT 5,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  user_id UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own agent messages"
ON public.agent_messages
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all agent messages"
ON public.agent_messages
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_agent_messages_receiver ON public.agent_messages(receiver_agent, status, created_at);
CREATE INDEX idx_agent_messages_sender ON public.agent_messages(sender_agent, created_at);
CREATE INDEX idx_agent_messages_user ON public.agent_messages(user_id, created_at);

-- Create agent_state table to track agent status
CREATE TABLE IF NOT EXISTS public.agent_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'idle',
  last_execution TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  performance_metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(agent_name, user_id)
);

-- Enable RLS
ALTER TABLE public.agent_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own agent states"
ON public.agent_state
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all agent states"
ON public.agent_state
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_agent_state_updated_at
BEFORE UPDATE ON public.agent_state
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();